const natural = require('natural');
const tokenizer = new natural.SentenceTokenizer();
const TfIdf = natural.TfIdf;

const generateSummary = (text, maxSentences = 3) => {
    if (!text || typeof text !== 'string') {
        return 'No description available';
    }

    try {
        // Clean the text
        const cleanText = text
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Split into sentences
        const sentences = tokenizer.tokenize(cleanText);
        if (sentences.length <= maxSentences) {
            return cleanText;
        }

        // Calculate sentence scores using TF-IDF
        const tfidf = new TfIdf();
        sentences.forEach(sentence => tfidf.addDocument(sentence));

        // Score each sentence
        const sentenceScores = sentences.map((sentence, index) => {
            let score = 0;
            const words = sentence.toLowerCase().split(/\W+/).filter(Boolean);
            
            words.forEach(word => {
                // Get TF-IDF score for the word in this sentence
                const tfidfScore = tfidf.tfidf(word, index);
                score += tfidfScore;
            });

            // Normalize by sentence length to avoid favoring longer sentences
            score = score / words.length;

            // Boost score for sentences that appear earlier (position bias)
            score *= (1 - index / sentences.length);

            return { index, score, text: sentence };
        });

        // Sort sentences by score and take top N
        const topSentences = sentenceScores
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSentences)
            .sort((a, b) => a.index - b.index); // Resort by original position

        const summary = topSentences.map(s => s.text).join(' ');
        return summary;
    } catch (error) {
        console.error('Error generating summary:', error);
        return text.split(/[.!?]+/)[0] + '.'; // Fallback to first sentence
    }
}

// Helper function to extract keywords from text
const extractKeywords = (text, maxKeywords = 5) => {
    if (!text) return [];

    const tfidf = new TfIdf();
    tfidf.addDocument(text);

    // Get all terms and their scores
    const terms = {};
    tfidf.listTerms(0).forEach(item => {
        terms[item.term] = item.tfidf;
    });

    // Filter out common words and sort by score
    return Object.entries(terms)
        .filter(([term]) => term.length > 2) // Filter out short words
        .sort(([,a], [,b]) => b - a)
        .slice(0, maxKeywords)
        .map(([term]) => term);
}

// Helper function to detect content categories
const detectCategories = (text) => {
    const categories = [];
    const lowercaseText = text.toLowerCase();

    const categoryPatterns = {
        tutorial: /(how to|tutorial|learn|guide|step by step)/,
        review: /(review|comparison|versus|vs\.?|analysis)/,
        news: /(news|announcement|update|release|latest)/,
        entertainment: /(music|game|movie|show|performance)/,
        educational: /(lecture|course|education|academic|study)/
    };

    for (const [category, pattern] of Object.entries(categoryPatterns)) {
        if (pattern.test(lowercaseText)) {
            categories.push(category);
        }
    }

    return categories;
}

module.exports = {
    generateSummary,
    extractKeywords,
    detectCategories
};
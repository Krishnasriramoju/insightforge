# Quick Test Guide - Authentication & History

## 🧪 Testing the New Features

### Test 1: Register a New User
**Steps:**
1. Go to http://localhost:5173
2. You should see the Login page with two tabs: "🔐 Login" and "✨ Register"
3. Click on "Register" tab
4. Enter:
   - Username: `testuser`
   - Password: `password123`
   - Confirm Password: `password123`
5. Click "✨ Register" button

**Expected Result:**
- You should see a green success message: "✓ Registration successful! Please login now."
- The form should switch back to Login mode

---

### Test 2: Login with Credentials
**Steps:**
1. You should now be on the Login tab
2. Enter:
   - Username: `testuser`
   - Password: `password123`
3. Click "🚀 Login" button

**Expected Result:**
- You should see success message: "✓ Login successful! Redirecting..."
- After 1 second, you'll be redirected to the main search interface
- The header should show "👤 testuser" and "🚪 Logout" button

---

### Test 3: Make a Search (This Saves to History)
**Steps:**
1. Click on the text input box in "Upload Section"
2. Enter some text, for example: `The sky is blue and beautiful today`
3. Click "Process" or press Enter
4. In the chat box, enter a question: `What color is the sky?`
5. Select a model (e.g., `phi3:mini`)
6. Click "🚀 Send"

**Expected Result:**
- You should get an AI response
- The question and response are automatically saved to your history

---

### Test 4: View Search History
**Steps:**
1. Look at the header - you should see navigation buttons
2. Click "📚 History" button

**Expected Result:**
- You'll see a list of your searches
- Each item shows:
  - Question number (#1, #2, etc.)
  - Your question text
  - Model used (e.g., "phi3:mini")
  - Timestamp (when the search was made)
- Click on any item to expand and see the full answer

---

### Test 5: Expand History Item
**Steps:**
1. On the History page, click on any history item

**Expected Result:**
- The item should expand showing:
  - Full answer text
  - Language used (e.g., "EN" for English)
  - Context length (number of tokens)
  - Full timestamp

---

### Test 6: Clear History
**Steps:**
1. On the History page, click "🗑️ Clear All" button
2. A confirmation dialog should appear: "Are you sure? This cannot be undone."
3. Click OK to confirm

**Expected Result:**
- All history items disappear
- Page shows: "No searches yet - Your search history will appear here after you perform a search."

---

### Test 7: Logout
**Steps:**
1. Click "🚪 Logout" button in the top right corner

**Expected Result:**
- You're redirected back to the login page
- Username is cleared from localStorage
- You'll need to login again to access the app

---

### Test 8: Login Again (Check Session Persistence)
**Steps:**
1. Login again with `testuser` / `password123`
2. Go to History page

**Expected Result:**
- You might see the history you created earlier (unless you cleared it)
- This proves that history is persisted in the database

---

### Test 9: Try Invalid Login
**Steps:**
1. Go to the login page
2. Enter:
   - Username: `testuser`
   - Password: `wrongpassword`
3. Click "🚀 Login"

**Expected Result:**
- You should see an error message: "❌ Invalid credentials"
- You should NOT be logged in

---

### Test 10: Try Registration with Invalid Data
**Steps:**
1. On Register tab, try:
   - Username: `ab` (too short)
   - Password: `pass123`
2. Click "✨ Register"

**Expected Result:**
- Error message: "Username must be at least 3 characters"

---

### Test 11: Try Registration with Duplicate Username
**Steps:**
1. Try to register with the same username you already used: `testuser`
2. Click "✨ Register"

**Expected Result:**
- Error message: "Registration failed" or similar
- Indicates that the user already exists

---

## 🔍 Checking Backend Database

### View Users Database
```bash
cat backend/database/users.json
```
You should see your registered users with hashed passwords.

### View History Database
```bash
cat backend/database/history.json
```
You should see your search history with timestamps.

---

## ✅ Checklist for Full Functionality

After running these tests, verify:

- [ ] Can register new user
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong password
- [ ] Searches are saved to history automatically
- [ ] Can view full history
- [ ] Can expand/collapse history items
- [ ] Can clear all history
- [ ] Can logout
- [ ] Session persists after reload
- [ ] Cannot register duplicate usernames
- [ ] Form validation works for short usernames/passwords
- [ ] UI is responsive and looks professional
- [ ] Animations are smooth
- [ ] Error messages are clear

---

## 🐛 Troubleshooting

### Issue: Backend returns 403/500 errors
**Solution**: Make sure backend is running at `http://localhost:3001`

### Issue: Cannot login with correct credentials
**Solution**: Check that the username and password match exactly (case-sensitive)

### Issue: History not saving
**Solution**: Make sure you're passing `username` in the search request - this happens automatically if logged in

### Issue: Port already in use
**Solution**: Run `Get-Process -Name node | Stop-Process -Force` to kill existing processes

### Issue: Styling looks broken
**Solution**: Check that CSS files are loaded - refresh the browser

---

## 📝 Test Summary

Your News Research Tool now has:
1. ✅ Secure user authentication
2. ✅ Persistent user accounts
3. ✅ Automatic search history tracking
4. ✅ Per-user history isolation
5. ✅ Professional UI with smooth animations
6. ✅ Responsive mobile design

Enjoy using your enhanced News Research Tool! 🚀

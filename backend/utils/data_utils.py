import json
from pathlib import Path

# Python helper module for reading and writing backend JSON data.
# This file adds a Python component to the repository.

BASE_DIR = Path(__file__).resolve().parents[1] / "backend" / "database"
BASE_DIR.mkdir(parents=True, exist_ok=True)


def load_json(filename: str) -> dict:
    file_path = BASE_DIR / filename
    if not file_path.exists():
        return {}
    with file_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(filename: str, data: dict) -> None:
    file_path = BASE_DIR / filename
    with file_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


if __name__ == "__main__":
    users = load_json("users.json")
    history = load_json("history.json")
    print(f"Loaded {len(users)} users and {len(history)} history entries.")

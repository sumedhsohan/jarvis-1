# app.py
from flask import Flask, request, jsonify
import subprocess
import requests

app = Flask(__name__)

MISTRAL_API_KEY = "mN7ANqgLSim4PsUq6xUeeom6XdCPjWYx"
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

@app.route("/ask", methods=["POST"])
def ask():
    user_input = request.json.get("query", "")
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "mistral-medium",
        "messages": [
            {"role": "system", "content": "You are Jarvis, a helpful assistant."},
            {"role": "user", "content": user_input}
        ]
    }
    try:
        response = requests.post(MISTRAL_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()['choices'][0]['message']['content']
        return jsonify({"response": result})
    except Exception as e:
        return jsonify({"response": "Sorry, I couldn’t get an answer.", "error": str(e)})

@app.route("/launch", methods=["POST"])
def launch():
    app_name = request.json.get("app")
    try:
        if app_name == "notepad":
            subprocess.Popen(["notepad.exe"])
            return jsonify({"status": "Notepad launched"})
        return jsonify({"error": "Unsupported app"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Allow frontend to connect

MISTRAL_API_KEY = "mN7ANqgLSim4PsUq6xUeeom6XdCPjWYx"
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

def ask_mistral(prompt):
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "mistral-small",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    res = requests.post(MISTRAL_URL, json=data, headers=headers)
    if res.status_code == 200:
        return res.json()["choices"][0]["message"]["content"]
    return "Sorry, I couldn't get a response from Mistral."

@app.route("/ask", methods=["POST"])
def ask():
    query = request.json.get("query")
    answer = ask_mistral(query)
    return jsonify({"response": answer})

if __name__ == "__main__":
    app.run(debug=True)

from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Serve the main game page
@app.route("/")
def home():
    return render_template("index.html")  # Ensure "index.html" is in the "templates" folder

# Serve all cards as JSON data
@app.route("/api/cards")
def get_cards():
    cards = [
        { "name": "Zeus", "type": "god", "health": 30, "power": 8, "speed": 7, "image": "images/zeus.png" },
        { "name": "Athena", "type": "god", "health": 26, "power": 9, "speed": 8, "image": "images/athena.png" },
        { "name": "Wisdom", "type": "action", "image": "images/wisdom.png" },
        { "name": "Fire", "type": "action", "image": "images/fire.png" },
        { "name": "Lightning", "type": "action", "image": "images/lightning.png" }
    ]
    return jsonify(cards)

# Save game results
@app.route("/api/save_game", methods=["POST"])
def save_game():
    data = request.json  # Get JSON data from the client
    print("Game data received:", data)  # Log for debugging
    return jsonify({"status": "success", "message": "Game saved!"})

if __name__ == "__main__":
    app.run(debug=True)

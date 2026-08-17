import os
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session
from helper import get_restaurants

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify(
            {
                "status": "error",
                "message": "Could not read location data.",
            }
        ), 400

    try:
        latitude = float(data.get("lat"))
        longitude = float(data.get("lon"))

    except (TypeError, ValueError):
        return jsonify(
            {
                "status": "error",
                "message": "Invalid GPS coordinates.",
            }
        ), 400

    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        return jsonify(
            {
                "status": "error",
                "message": "GPS coordinates are outside the valid range.",
            }
        ), 400

    # This is the location shown as the user's marker
    # on the results map.
    session["user_latitude"] = latitude
    session["user_longitude"] = longitude

    restaurants = get_restaurants(
        latitude,
        longitude,
    )

    if restaurants is None:
        return jsonify(
            {
                "status": "error",
                "message": "Restaurant mapping service is temporarily unavailable.",
            }
        ), 503

    session["scanned_food_spots"] = restaurants

    return jsonify(
        {
            "status": "success",
            "message": f"Successfully mapped {len(restaurants)} spots.",
        }
    )


@app.route("/results")
def results():
    return render_template(
        "results.html",
        restaurants=session.get(
            "scanned_food_spots",
            []
        ),
        user_latitude=session.get(
            "user_latitude"
        ),
        user_longitude=session.get(
            "user_longitude"
        ),
    )


if __name__ == "__main__":
   app.run(host="0.0.0.0", port=5000, debug=True)
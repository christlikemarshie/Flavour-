from flask import Flask, jsonify, render_template, request, session
import urllib.request
import urllib.parse
import json

app = Flask(__name__)
app.secret_key = "secretkey"  # Needed for session storage

@app.route("/")
def index():
    return render_template("index.html")

# ROUTE 2: GPS BACKGROUND RADAR SWEEP

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()
    latitude = data.get("lat")
    longitude = data.get("lon")

    if latitude is None or longitude is None:
        return jsonify({
            "status": "error",
            "message": "Location coordinates are missing"
        }), 400


    # Define bounding box around the coordinates
    offset = 0.01
    min_lat = float(latitude) - offset
    min_lon = float(longitude) - offset
    max_lat = float(latitude) + offset
    max_lon = float(longitude) + offset

    # Overpass query for restaurants
    overpass_query = f"""
    [out:json][timeout:25];
    node["amenity"="restaurant"]({min_lat},{min_lon},{max_lat},{max_lon});
    out body;
    """

    overpass_url = "https://overpass-api.de/api/interpreter"

    try:
        encoded_data = urllib.parse.urlencode({"data": overpass_query}).encode("utf-8")
        req = urllib.request.Request(overpass_url, data=encoded_data, method="POST")
        req.add_header("User-Agent","TasteQuest Restaurant Locator/1.0 (theemarshieman@gmail.com)")
        req.add_header("Accept","application/json")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        

        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read().decode("utf-8").strip()
            if not raw:
                raise ValueError("Empty response from Overpass API")
            result_data = json.loads(raw)

        # Extract restaurant nodes
        elements = result_data.get("elements", [])
        cleaned_restaurants = []
        for item in elements:
            tags = item.get("tags", {})
            cleaned_restaurants.append({
                "name": tags.get("name", "Unnamed Local Eatery"),
                "cuisine": tags.get("cuisine", "Local Delicacies").replace(";", ", ").title(),
                "address": tags.get("addr:street", "Nearby Location Track"),
                "lat": item.get("lat"),
                "lon": item.get("lon")
            })

        # Store results in session
        session["scanned_food_spots"] = cleaned_restaurants
        print(f"✅ Found {len(cleaned_restaurants)} restaurants")


        return jsonify({"status": "success", "message": f"Successfully mapped {len(cleaned_restaurants)} spots"})

    except Exception as e:
        print(f"🚨 overpass failed to give u feedback: {e}")
        return jsonify({"status": "error", "message": "Global mapping telemetry failed to respond"})

# =================================================================
# ROUTE 3: RESULTS PAGE
# =================================================================
@app.route("/results")
def results():
    restaurants = session.get("scanned_food_spots", [])
    return render_template("results.html", restaurants=restaurants)

# Kick the app alive
if __name__ == "__main__":
    app.run(debug=True)

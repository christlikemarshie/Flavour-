from flask import Flask, jsonify, render_template, request, session
import json
import math
import urllib.parse
import urllib.request


app = Flask(__name__)
app.secret_key = "secretkey"


OVERPASS_SERVERS = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

#  the hervesine formula is used to calculate the distance between
#  two points on the surface of a sphere, given their latitudes and 
# longitudes. It accounts for the curvature of the Earth, providing an 
# accurate measurement of the straight-line distance between two geographic coordinates.
def calculate_distance(lat1, lon1, lat2, lon2):
    """Return the straight-line distance between two coordinates in kilometres."""
    earth_radius_km = 6371.0

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    difference_lat = math.radians(lat2 - lat1)
    difference_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(difference_lat / 2) ** 2
        + math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(difference_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return earth_radius_km * c


def get_coordinates(element):
    """Get coordinates from an OSM node, way, or relation result."""
    if element.get("lat") is not None and element.get("lon") is not None:
        return element["lat"], element["lon"]

    center = element.get("center", {})
    return center.get("lat"), center.get("lon")


def get_address(tags):
    """Build an address from the OpenStreetMap address tags that are available."""
    street = tags.get("addr:street")
    house_number = tags.get("addr:housenumber")
    city = tags.get("addr:city")

    street_address = " ".join(
        part for part in (house_number, street) if part
    )
    address_parts = [part for part in (street_address, city) if part]

    return ", ".join(address_parts) or "Nearby location"


def get_website(tags):
    """Return an external website URL when OSM provides one."""
    website = tags.get("website") or tags.get("contact:website")

    if website and not website.startswith(("http://", "https://")):
        return f"https://{website}"

    return website


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/search", methods=["POST"])
def search():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Could not read location data.",
        }), 400

    try:
        latitude = float(data.get("lat"))
        longitude = float(data.get("lon"))
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Invalid GPS coordinates.",
        }), 400

    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        return jsonify({
            "status": "error",
            "message": "GPS coordinates are outside the valid range.",
        }), 400

    # This is the location shown as the user's marker on the results map.
    session["user_latitude"] = latitude
    session["user_longitude"] = longitude

    offset = 0.01
    min_lat = latitude - offset
    min_lon = longitude - offset
    max_lat = latitude + offset
    max_lon = longitude + offset

    overpass_query = f"""
[out:json][timeout:25];
(
  node["amenity"="restaurant"]({min_lat},{min_lon},{max_lat},{max_lon});
  way["amenity"="restaurant"]({min_lat},{min_lon},{max_lat},{max_lon});
  relation["amenity"="restaurant"]({min_lat},{min_lon},{max_lat},{max_lon});
);
out center;
"""

    result_data = None
    encoded_data = urllib.parse.urlencode({"data": overpass_query}).encode("utf-8")

    for server in OVERPASS_SERVERS:
        request_to_overpass = urllib.request.Request(
            server,
            data=encoded_data,
            method="POST",
            headers={
                "User-Agent": "TasteQuest Restaurant Locator/1.0",
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )

        try:
            with urllib.request.urlopen(request_to_overpass, timeout=15) as response:
                response_body = response.read().decode("utf-8").strip()

            if response_body:
                result_data = json.loads(response_body)
                break
        except (OSError, ValueError, json.JSONDecodeError) as error:
            app.logger.warning("Overpass server failed: %s (%s)", server, error)

    if result_data is None:
        return jsonify({
            "status": "error",
            "message": "Restaurant mapping service is temporarily unavailable.",
        }), 503

    restaurants = []
    seen_restaurants = set()

    for element in result_data.get("elements", []):
        restaurant_lat, restaurant_lon = get_coordinates(element)

        if restaurant_lat is None or restaurant_lon is None:
            continue

        try:
            restaurant_lat = float(restaurant_lat)
            restaurant_lon = float(restaurant_lon)
        except (TypeError, ValueError):
            continue

        tags = element.get("tags", {})
        name = tags.get("name", "Unnamed local eatery").strip()
        cuisine = (tags.get("cuisine") or "Local delicacies").replace(";", ", ").title()

        duplicate_key = (
            name.casefold(),
            round(restaurant_lat, 6),
            round(restaurant_lon, 6),
        )
        if duplicate_key in seen_restaurants:
            continue

        seen_restaurants.add(duplicate_key)

        restaurants.append({
            "name": name,
            "cuisine": cuisine,
            "address": get_address(tags),
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "website": get_website(tags),
            "opening_hours": tags.get("opening_hours"),
            "image": tags.get("image") or tags.get("contact:image"),
            "lat": restaurant_lat,
            "lon": restaurant_lon,
            "distance": round(
                calculate_distance(latitude, longitude, restaurant_lat, restaurant_lon),
                2,
            ),
        })

    restaurants.sort(key=lambda restaurant: restaurant["distance"])
    session["scanned_food_spots"] = restaurants

    return jsonify({
        "status": "success",
        "message": f"Successfully mapped {len(restaurants)} spots.",
    })


@app.route("/results")
def results():
    return render_template(
        "results.html",
        restaurants=session.get("scanned_food_spots", []),
        user_latitude=session.get("user_latitude"),
        user_longitude=session.get("user_longitude"),
    )


if __name__ == "__main__":
    app.run(debug=True)

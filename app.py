import os
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, render_template, request, session, url_for
from helper import get_restaurants

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")
app.config["SITE_URL"] = os.environ.get(
    "SITE_URL", "https://flavour-6igf.onrender.com"
).strip().rstrip("/")
app.config["GOOGLE_SITE_VERIFICATION_FILE"] = os.environ.get(
    "GOOGLE_SITE_VERIFICATION_FILE", "googlefe1fa99a38703b62.html"
).strip()

@app.route("/")
def index():
    return render_template(
        "index.html",
        canonical_url=public_url(url_for("index")),
    )


def public_url(path):
    """Build an absolute URL, preferring the configured production site URL."""
    site_url = app.config["SITE_URL"] or request.url_root.rstrip("/")
    return f"{site_url}{path}"


@app.route("/robots.txt")
def robots_txt():
    sitemap_url = public_url(url_for("sitemap_xml"))
    body = "User-agent: *\nAllow: /\nDisallow: /search\n\n"
    body += f"Sitemap: {sitemap_url}\n"
    return Response(body, mimetype="text/plain")


@app.route("/sitemap.xml")
def sitemap_xml():
    homepage = public_url(url_for("index"))
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"  <url><loc>{homepage}</loc></url>\n"
        '</urlset>\n'
    )
    return Response(body, mimetype="application/xml")

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
        canonical_url=public_url(url_for("results")),
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
@app.route("/<verification_filename>")
def google_site_verification(verification_filename):
    filename = app.config["GOOGLE_SITE_VERIFICATION_FILE"]
    if not filename.endswith(".html") or "/" in filename or "\\" in filename:
        return "Not found", 404
    if verification_filename != filename:
        return "Not found", 404
    return f"google-site-verification: {filename}"


if __name__ == "__main__":
    app.run(debug=True)

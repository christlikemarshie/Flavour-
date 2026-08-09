from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

@app.route("/")
def index():

    return render_template("index.html")


# =================================================================
# ROUTE 2: THE GPS BACKGROUND RADAR SWEEP (FUTURE CONNECTION)
# =================================================================
@app.route("/search", methods=["POST"])
def search():
    # Leave this block simple for now! 
    # Your JavaScript file will use this route later to securely pass 
    # the traveler's phone coordinates over to your Python backend.
    data = request.get_json()
    
    # 📝 FUTURE LOGIC PLACEMENT:
    # This is exactly where we will write the code to send those 
    # coordinates to OpenStreetMap and sift out real nearby food spots.
    
    return jsonify({"status": "success", "message": "Server connected!"})


# This line kicks your application alive when you run the file
if __name__ == "__main__":
    app.run(debug=True)

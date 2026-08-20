# project name : Flavour

#### Video Demo: https://youtu.be/OI-ZdzSZh38
## Description

Flavour is a small web app that answers one very specific, very relatable question: **"what's actually near me to eat right now?"** You open it up, hit one button, and it finds real restaurants around your current location, drops them on a map, and lets you click through them like a little food radar.

I built this as my CS50x final project, and it's a Flask app on the backend with vanilla JavaScript doing the heavy lifting on the frontend. No frameworks like React, no database — just Flask sessions, the browser's geolocation API, and a public map data source called OpenStreetMap (through something called the Overpass API) doing the actual restaurant-finding.

Here's is how flavour works: you land on the homepage and see a big glassy "Find Food Near Me" button sitting over an animated 3D background (I used Spline for desktop and a lighter Lottie animation for mobile, because a full 3D scene on someone's phone is just asking for lag) and the reason why i also took my time on the UI is because i really believe that the way a piece of software looks its what makes people wanna use it regardless of functionality alone. You click it, your browser asks for location permission, and once you allow it, your coordinates get sent to the Flask backend. The backend builds a bounding box around you, roughly a few kilometers in every direction, and sends a request to Overpass for every node tagged as a restaurant inside that box. It cleans the data up — remove duplicate places that show up more than once, calculates how far each one is from you using the haversine formula(is used to calculate the shortest distance between two points on the Earth’s surface, given their latitude and longitude.), sorts everything by distance, and stores the whole list in the session. Then you get redirected to a results page showing every restaurant as a card (with cuisine, address, phone, hours, and a website link if openstreetmap has one) plus an interactive Leaflet map with a marker for each spot. Click the view on map button, the map flies to it. Click a marker, the matching card gets highlighted. It's meant to feel connected, not like two separate features bolted together and like i said i also did spend time on the UI so that it doesnt feel crunky.

## Why I made the choices I made

**No API keys for restaurant data.** I didn't want this project to die the moment a free-tier Google Places quota ran out, so I went with OpenStreetMap/Overpass instead, which is free and doesn't need a key. The tradeoff is that OSM data isn't always as complete as Google's — some restaurants are missing phone numbers or hours — so I made the template render those fields conditionally instead of showing empty labels everywhere but it is still useful as ever.

**Multiple Overpass servers.** The fact that the map i used is open source and free it usually gets hammered with traffic and times out fairly often, so `helper.py` tries a short list of mirror servers in order and just moves to the next one if a request fails. It made local testing way less frustrating.

**Caching the user's coordinates in localStorage.** Browsers only ask for geolocation permission once per session anyway, but I still cache the last known coordinates so a returning user doesn't have to sit through the "allow location access?" prompt again if they just want to refresh results. well unlike  google maps the live tracking system is not ben implimented yet  but closely enough i placed a "search another area" button which deletes the current coordinates  in the browser during a session useful when a person has changed location

**Fallback images by cuisine.** A lot of OpenStreetMap restaurants  don't have a photo attached. Rather than showing a broken image icon, `get_restaurant_image()` in `helper.py` picks a generic fallback photo based on the cuisine tag (pizza, Indian, Thai, etc.), so the results page never looks empty or broken and still adds thta completion  to it.

**Flask sessions instead of a database.** Since a search result only needs to live long enough for someone to look at their results page, I didn't see the point of bulding  a full database for it. The session just holds the last search until the user runs a new one.

## File structure, usage and full detail of every file

 `app.py` — the Flask app itself: the two routes (`/` and `/search`) plus `/results`, which reads whatever the last search stored in the session.
`helper.py` — this actually conatains most of the functions that make  the actual work happen: talking to Overpass, calculating distance, building addresses out of whatever OSM tags exist, and picking fallback images.
 `templates/` — `base.html` is the shared layout, `index.html` is the landing page, `results.html` renders the restaurant cards and the map.
 `static/js/script.js` — handles the geolocation request and the loading animation on the homepage.
 `static/js/results.js` — builds the Leaflet map, drops markers, and wires up the card-to-map interactions.
`static/css/` — separate stylesheets for the landing page and the results page, since they look pretty different from each other.
`requirements.txt` — Flask, python-dotenv, requests, and gunicorn for deployment.
`Procfile` — tells a host like Render or Heroku to run the app with gunicorn.

## What I'd add if I kept working on this

A search radius slider (right now it's fixed), filtering by cuisine type, and maybe caching Overpass results server-side so repeat searches in the same area don't have to hit the API again. Honestly, the geolocation permission prompt is also a bit unreliable on some browsers, and I'd like to add a manual "type your address" fallback for people who don't want to share GPS.

but for now its useful and works so i will leave it as is

document.addEventListener("DOMContentLoaded", () => {
    const mapElement = document.getElementById("map");

    if (!mapElement || typeof L === "undefined") {
        return;
    }

    const userLatitude = Number.parseFloat(mapElement.dataset.userLat);
    const userLongitude = Number.parseFloat(mapElement.dataset.userLon);
    const hasUserLocation = Number.isFinite(userLatitude) && Number.isFinite(userLongitude);
    const map = L.map(mapElement);
    const markerByIndex = new Map();
    const cardByIndex = new Map();
    const mapLocations = [];

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    function selectCard(index) {
        document.querySelectorAll(".restaurant-card.selected").forEach((card) => {
            card.classList.remove("selected");
        });

        const card = cardByIndex.get(index);
        if (card) {
            card.classList.add("selected");
        }
    }

function showRestaurantOnMap(index) {
    const marker = markerByIndex.get(index);
    const card = cardByIndex.get(index);

    if (!marker || !card) {
        return;
    }

    selectCard(index);

    mapElement.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    map.flyTo(marker.getLatLng(), 18, { duration: 0.5 });
    marker.openPopup();
}

    function createPopup(card) {
        const popup = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = card.querySelector("h3").textContent;
        popup.appendChild(name);

        const distance = card.querySelector(".restaurant-card__distance");
        if (distance) {
            const distanceText = document.createElement("div");
            distanceText.textContent = distance.textContent.trim();
            popup.appendChild(distanceText);
        }

        return popup;
    }

    document.querySelectorAll(".restaurant-card").forEach((card) => {
        const index = card.dataset.restaurantIndex;
        const latitude = Number.parseFloat(card.dataset.lat);
        const longitude = Number.parseFloat(card.dataset.lon);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return;
        }

        cardByIndex.set(index, card);
        mapLocations.push([latitude, longitude]);

        const marker = L.marker([latitude, longitude], {
            alt: card.querySelector("h3").textContent,
            title: card.querySelector("h3").textContent,
        })
            .addTo(map)
            .bindPopup(createPopup(card));

        marker.on("click", () => {
            selectCard(index);
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });

        markerByIndex.set(index, marker);
    });

    if (hasUserLocation) {
        const userLocation = [userLatitude, userLongitude];
        mapLocations.push(userLocation);

        L.circleMarker(userLocation, {
            color: "#1d4ed8",
            fillColor: "#3b82f6",
            fillOpacity: 1,
            radius: 8,
        })
            .addTo(map)
            .bindPopup("Your location");
    }

    if (mapLocations.length > 1) {
        map.fitBounds(mapLocations, { padding: [30, 30], maxZoom: 17});
    } else if (mapLocations.length === 1) {
        map.setView(mapLocations[0], 15);
    } else {
        map.setView([0, 0], 2);
    }

    document.querySelectorAll(".view-on-map-button").forEach((button) => {
        button.addEventListener("click", () => {
            showRestaurantOnMap(button.dataset.restaurantIndex, false);
        });
    });

    requestAnimationFrame(() => map.invalidateSize());
});

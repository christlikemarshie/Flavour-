document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // SEARCH ANOTHER AREA
    // =========================================================



    // =========================================================
    // LOCATE BUTTON
    // =========================================================

    const locateBtn = document.getElementById("locate-btn");

    if (!locateBtn) return;

    locateBtn.addEventListener("click", function () {
        locateBtn.disabled = true;
        const originalText = locateBtn.innerHTML;
        locateBtn.innerHTML = "🔄 Scanning...";
        locateBtn.style.opacity = "0.7";
        locateBtn.style.cursor = "wait";

        showLoadingMessage("📍 Getting your location...");

        const savedLat = localStorage.getItem("tastequest_lat");
        const savedLon = localStorage.getItem("tastequest_lon");

        if (savedLat && savedLon) {
            console.log("📦 Using saved GPS coordinates");
            showLoadingMessage("🍽️ Searching for nearby restaurants...");
            sendCoordinatesToPython(savedLat, savedLon);
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
                enableHighAccuracy: false,
                timeout: 120000,
                maximumAge: 300000
            });
        } else {
            resetButton();
            alert("Satellite GPS tracking is not supported by your browser.");
        }

        function successCallback(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log("✅ GPS location received");
            console.log("Latitude:", lat);
            console.log("Longitude:", lon);

            localStorage.setItem("tastequest_lat", lat);
            localStorage.setItem("tastequest_lon", lon);

            showLoadingMessage("🍽️ Searching for nearby restaurants...");
            sendCoordinatesToPython(lat, lon);
        }

        function errorCallback(error) {
            console.warn("⚠️ GPS error:", error.code);
            resetButton();
            alert("Warming up satellite tracking links. Please tap the button again to lock your position!");
        }

        function sendCoordinatesToPython(latitude, longitude) {
            console.log("📡 Sending coordinates to Flask...");
            showLoadingMessage("🌍 Connecting to restaurant mapping service...");

            fetch("/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lat: latitude, lon: longitude })
            })
            .then(response => {
                console.log("📡 Flask HTTP status:", response.status);
                return response.json();
            })
            .then(data => {
                console.log("📥 Flask response:", data);

                if (data.status === "success") {
                    showLoadingMessage("✅ Restaurants found! Loading results...");
                    setTimeout(() => window.location.href = "/results", 500);
                } else {
                    resetButton();
                    alert(data.message || "Unable to find nearby restaurants.");
                }
            })
            .catch(error => {
                console.error("❌ Network sync failure:", error);
                resetButton();
                alert("Radar transmission dropped. Please check your internet connection.");
            });
        }

        function showLoadingMessage(message) {
            let loadingMessage = document.getElementById("tastequest-loading");

            if (!loadingMessage) {
                loadingMessage = document.createElement("div");
                loadingMessage.id = "tastequest-loading";
                loadingMessage.style.cssText = "margin-top:15px;text-align:center;font-size:16px;font-weight:600;";
                locateBtn.parentNode.appendChild(loadingMessage);
            }

            loadingMessage.innerHTML = `<span class="loading-spinner">◌</span> ${message}`;

            if (!document.getElementById("tastequest-spinner-style")) {
                const style = document.createElement("style");
                style.id = "tastequest-spinner-style";
                style.innerHTML = `
                    .loading-spinner {
                        display:inline-block;
                        animation:tastequest-spin 1s linear infinite;
                        font-size:20px;
                    }
                    @keyframes tastequest-spin {
                        from { transform:rotate(0deg); }
                        to { transform:rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        function resetButton() {
            locateBtn.disabled = false;
            locateBtn.innerHTML = originalText;
            locateBtn.style.opacity = "1";
            locateBtn.style.cursor = "pointer";

            const loadingMessage = document.getElementById("tastequest-loading");
            if (loadingMessage) loadingMessage.remove();
        }
    });
});
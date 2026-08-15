document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // FLAVOUR LOADING SCREEN
    // =========================================================

    function startFlavourLoading() {
        const overlay = document.getElementById("flavour-loading-overlay");

        if (overlay) {
            overlay.classList.add("active");
        }
    }

    function stopFlavourLoading() {
        const overlay = document.getElementById("flavour-loading-overlay");

        if (overlay) {
            overlay.classList.remove("active");
        }
    }

    // =========================================================
    // LOCATE BUTTON
    // =========================================================

    const locateBtn = document.getElementById("locate-btn");

    if (!locateBtn) return;

    locateBtn.addEventListener("click", function () {

        // Start the beautiful full-screen loading animation
        startFlavourLoading();

        // Prevent multiple clicks
        locateBtn.disabled = true;
        locateBtn.style.opacity = "0.7";
        locateBtn.style.cursor = "wait";

        // =====================================================
        // CHECK FOR SAVED LOCATION
        // =====================================================

        const savedLat = localStorage.getItem("tastequest_lat");
        const savedLon = localStorage.getItem("tastequest_lon");

        if (savedLat && savedLon) {
            sendCoordinatesToPython(savedLat, savedLon);
            return;
        }

        // =====================================================
        // GET USER LOCATION
        // =====================================================

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                successCallback,
                errorCallback,
                {
                    enableHighAccuracy: false,
                    timeout: 120000,
                    maximumAge: 300000
                }
            );
        } else {
            resetButton();
            alert(
                "Satellite GPS tracking is not supported by your browser."
            );
        }

        // =====================================================
        // LOCATION SUCCESS
        // =====================================================

        function successCallback(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            localStorage.setItem("tastequest_lat", lat);
            localStorage.setItem("tastequest_lon", lon);

            sendCoordinatesToPython(lat, lon);
        }

        // =====================================================
        // LOCATION ERROR
        // =====================================================

        function errorCallback(error) {
            resetButton();
            alert(
                "Warming up satellite tracking links. Please tap the button again to lock your position!"
            );
        }

        // =====================================================
        // SEND LOCATION TO FLASK
        // =====================================================

        function sendCoordinatesToPython(latitude, longitude) {
            fetch("/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    lat: latitude,
                    lon: longitude
                })
            })
            .then(response => {
                return response.json();
            })
            .then(data => {
                if (data.status === "success") {
                    setTimeout(() => {
                        window.location.href = "/results";
                    }, 500);
                } else {
                    resetButton();
                    alert(
                        data.message ||
                        "Unable to find nearby restaurants."
                    );
                }
            })
            .catch(error => {
                resetButton();
                alert(
                    "Radar transmission dropped. Please check your internet connection."
                );
            });
        }

        // =====================================================
        // RESET BUTTON / LOADING SCREEN
        // =====================================================

        function resetButton() {
            stopFlavourLoading();
            locateBtn.disabled = false;
            locateBtn.style.opacity = "1";
            locateBtn.style.cursor = "pointer";
        }

    });

});

document.addEventListener("DOMContentLoaded", function() {
    
    const locateBtn = document.getElementById("locate-btn");

    if (locateBtn) {
        locateBtn.addEventListener("click", function() {
            
            // 🧠 CHECKS THE STORAGE VAULT FIRST: If we already locked your location earlier,
            // we load it instantly from memory without making the browser perform a slow search!
            const savedLat = localStorage.getItem("tastequest_lat");
            const savedLon = localStorage.getItem("tastequest_lon");

            if (savedLat && savedLon) {
                alert("Location locked! \nLatitude: " + savedLat + "\nLongitude: " + savedLon);
                return; // Stops the code here because we already have your data!
            }

            // If the storage vault is empty, we perform a clean, optimized search
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
                    enableHighAccuracy: false, // 🚀 FAST PERFORMANCE: Bypasses heavy hardware searches
                    timeout: 10000,            // ⏱️ EXTENDED TIME: Gives your PC 10 seconds to think on the first cold start
                    maximumAge: 300000         // 🧼 CACHE LOCK: Remembers your location inside browser tracks for 5 full minutes
                });
            } else {
                alert("Satellite GPS tracking is not supported by your mobile browser.");
            }
        });
    }

    // Runs the second the user allows access
    function successCallback(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // 🔒 THE MEMORY LOCK: Lock your coordinates inside Chrome's permanent local storage vault!
        localStorage.setItem("tastequest_lat", lat);
        localStorage.setItem("tastequest_lon", lon);
        
        alert("Target Locked & Saved! \nLatitude: " + lat + "\nLongitude: " + lon);
    }

    // Catches failures safely without disrupting user momentum
    function errorCallback(error) {
        console.warn("Tracking hardware delay code: " + error.code);
        alert("Warming up satellite tracking links. Please tap the button one more time to lock your position!");
    }
});

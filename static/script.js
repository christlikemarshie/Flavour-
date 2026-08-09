document.addEventListener("DOMContentLoaded", function() { 
    const locateBtn = document.getElementById("locate-btn"); 

    // THE POSITION RESET SAFETY VALVE (THE EDGE CASE FIX)

    // Target your navigation back button precisely using its text link attributes
    const scanAgainBtn = document.querySelector(".cta-button-radar[href='/']");
    if (scanAgainBtn) {
        scanAgainBtn.addEventListener("click", function() {
            // Wipes the old frozen coordinates out of the vault instantly on click!
            localStorage.removeItem("tastequest_lat");
            localStorage.removeItem("tastequest_lon");
            console.log("Memory vault cleared for position change updates.");
        });
    }

    //  RADAR SWEEP OPERATIONS (Your verified stable code loops)

    if (locateBtn) { 
        locateBtn.addEventListener("click", function() { 
            //  CHECKS THE STORAGE VAULT FIRST
            const savedLat = localStorage.getItem("tastequest_lat"); 
            const savedLon = localStorage.getItem("tastequest_lon"); 

            if (savedLat && savedLon) { 
                sendCoordinatesToPython(savedLat, savedLon);
                return; 
            } 

            // If the storage vault is empty, we perform a clean, optimized search 
            if (navigator.geolocation) { 
                navigator.geolocation.getCurrentPosition(successCallback, errorCallback, { 
                    enableHighAccuracy: false, 
                    timeout: 10000, 
                    maximumAge: 300000 
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

        // 🔒 THE MEMORY LOCK
        localStorage.setItem("tastequest_lat", lat); 
        localStorage.setItem("tastequest_lon", lon); 

        sendCoordinatesToPython(lat, lon);
    } 

    // Catches failures safely without disrupting user momentum 
    function errorCallback(error) { 
        console.warn("Tracking hardware delay code: " + error.code); 
        alert("Warming up satellite tracking links. Please tap the button one more time to lock your position!"); 
    } 

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
        .then(response => response.json()) 
        .then(data => {
            if (data.status === "success") {
                window.location.href = "/results";
            }
        })
        .catch(error => {
            console.error("Network sync failure:", error);
            alert("Radar transmission dropped. Please check your network backend connection.");
        });
    }
});

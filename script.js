// script.js

let map;
let markers = [];

// Initialize map
function initMap() {
  // Default map view (India)
  map = L.map('map').setView([20.5937, 78.9629], 5);

  // OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

// Clear previous markers
function clearMarkers() {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  document.getElementById("placesList").innerHTML = "";
}

// Search for location (city/state)
function searchLocation() {
  const query = document.getElementById("searchBox").value;
  if (!query) return alert("Enter a city or state!");

  // Geocode location
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        const place = data[0];
        const lat = place.lat;
        const lon = place.lon;

        map.setView([lat, lon], 13);

        // Find colleges near this location
        findColleges(lat, lon);
      } else {
        alert("Location not found!");
      }
    });
}

// Find my current location
function findMyLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    map.setView([lat, lon], 13);

    // Show colleges near me
    findColleges(lat, lon);
  });
}

// Find colleges/universities nearby using Overpass API
function findColleges(lat, lon) {
  clearMarkers();

  // Overpass API query for universities/colleges within 5km radius
  const overpassQuery = `
    [out:json];
    (
      node["amenity"="university"](around:5000,${lat},${lon});
      node["amenity"="college"](around:5000,${lat},${lon});
      way["amenity"="university"](around:5000,${lat},${lon});
      way["amenity"="college"](around:5000,${lat},${lon});
      relation["amenity"="university"](around:5000,${lat},${lon});
      relation["amenity"="college"](around:5000,${lat},${lon});
    );
    out center;
  `;

  fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: overpassQuery
  })
    .then(res => res.json())
    .then(data => {
      if (data.elements.length === 0) {
        alert("No colleges/universities found nearby!");
        return;
      }

      const placesList = document.getElementById("placesList");

      data.elements.forEach(place => {
        const lat = place.lat || place.center.lat;
        const lon = place.lon || place.center.lon;
        const name = place.tags.name || "Unnamed College/University";

        // Add marker
        const marker = L.marker([lat, lon]).addTo(map)
          .bindPopup(`<b>${name}</b>`);
        markers.push(marker);

        // Add to sidebar
        const li = document.createElement("li");
        li.textContent = name;
        li.onclick = () => {
          map.setView([lat, lon], 17);
          marker.openPopup();
        };
        placesList.appendChild(li);
      });
    })
    .catch(err => {
      console.error("Error fetching Overpass API:", err);
      alert("Failed to load nearby colleges.");
    });
}

// Run map when page loads
window.onload = initMap;

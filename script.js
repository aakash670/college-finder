let map;
let markers = [];

// Initialize the map
function initMap() {
  map = L.map("map").setView([20.5937, 78.9629], 5); // India center

  // OpenStreetMap Tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

// Search location and fetch colleges
async function searchLocation() {
  const query = document.getElementById("searchBox").value.trim();
  if (!query) return alert("Enter a state, city, or district name!");

  try {
    // Geocode the location (convert name → lat/lon)
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const geoData = await geoRes.json();

    if (!geoData.length) {
      alert("Location not found!");
      return;
    }

    const { lat, lon, boundingbox } = geoData[0];

    // Zoom to searched area
    map.fitBounds([
      [boundingbox[0], boundingbox[2]],
      [boundingbox[1], boundingbox[3]]
    ]);

    // Clear old markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // Fetch colleges/universities in bounding box
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="college"](${boundingbox[0]},${boundingbox[2]},${boundingbox[1]},${boundingbox[3]});
        node["amenity"="university"](${boundingbox[0]},${boundingbox[2]},${boundingbox[1]},${boundingbox[3]});
        way["amenity"="college"](${boundingbox[0]},${boundingbox[2]},${boundingbox[1]},${boundingbox[3]});
        way["amenity"="university"](${boundingbox[0]},${boundingbox[2]},${boundingbox[1]},${boundingbox[3]});
      );
      out center;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery
    });
    const data = await response.json();

    const list = document.getElementById("placesList");
    list.innerHTML = "";

    if (!data.elements.length) {
      list.innerHTML = "<li>No colleges found in this area.</li>";
      return;
    }

    data.elements.forEach(el => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      const name = el.tags.name || "Unnamed College/University";

      if (lat && lon) {
        const marker = L.marker([lat, lon]).addTo(map).bindPopup(name);
        markers.push(marker);

        const li = document.createElement("li");
        li.textContent = name;
        list.appendChild(li);
      }
    });

  } catch (err) {
    console.error(err);
    alert("Error fetching data. Try again!");
  }
}

// Get user’s current location
function findMyLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported!");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 13);

      const marker = L.marker([latitude, longitude]).addTo(map).bindPopup("📍 You are here!");
      markers.push(marker);
    },
    () => alert("Unable to fetch your location!")
  );
}

// Init map on load
window.onload = initMap;

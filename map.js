function createMap(elementId, centerLat, centerLng, zoomLevel) {
  const map = L.map(elementId).setView([centerLat, centerLng], zoomLevel)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map)

  return map
}

function addMarker(map, lat, lng, popupContent) {
  const marker = L.marker([lat, lng]).addTo(map)
  if (popupContent) {
    marker.bindPopup(popupContent)
  }
  return marker
}

function createClickableMap(elementId, centerLat, centerLng, zoomLevel, onClickCallback) {
  const map = createMap(elementId, centerLat, centerLng, zoomLevel)
  let marker = null

  map.on("click", function (e) {
    const lat = e.latlng.lat
    const lng = e.latlng.lng

    if (marker) {
      map.removeLayer(marker)
    }

    marker = L.marker([lat, lng]).addTo(map)

    if (onClickCallback) {
      onClickCallback(lat, lng, marker)
    }
  })

  return { map, getMarker: () => marker }
}

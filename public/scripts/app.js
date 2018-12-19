'use strict';

let issCoords = {};
let userLoc = {};
let locationCoords = {};
let issMarker;
let issCirc;

// Get ISS coordinates then create map with ISS marker
$.ajax({
  url: '/issLoc',
  method: 'GET',
})
  .then(issLoc => {
    issCoords.lat = issLoc[0].issLat;
    issCoords.lng = issLoc[0].issLng;

    var mymap = L.map('map').setView([issCoords.lat, issCoords.lng], 2);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWJnb3NlY28iLCJhIjoiY2pwdTNoZGh0MGNvejQybWhxMThsNXc0OCJ9.LShDX_H_VSZYAOy_vQD-nQ', {
      maxZoom: 18,
      id: 'mapbox.streets'
    }).addTo(mymap);
    issMarker = L.marker([issCoords.lat, issCoords.lng]).addTo(mymap);
    issCirc = L.circle([issCoords.lat, issCoords.lng], { radius: 2270000 }).addTo(mymap);
    issMapUpdate();
  }).catch(error => console.error(error));
console.log('ISS coords: ', issCoords);

// Get user coordinates and formatted address
$.ajax({
  url: '/userLoc',
  method: 'GET'
})
  .then(location => {
    userLoc.lat = location.lat;
    userLoc.lng = location.lng;
    getUserAddress(location);

  }).catch(error => console.error(error));
console.log('user location: ', userLoc);

// Updates the map every 5 seconds
function issMapUpdate() {
  $.ajax({
    url: '/issLoc',
    method: 'GET',
  })
    .then(issLoc => {
      issCoords.lat = issLoc[0].issLat;
      issCoords.lng = issLoc[0].issLng;

      issMarker.setLatLng([issCoords.lat, issCoords.lng]);
      issCirc.setLatLng([issCoords.lat, issCoords.lng]);

    }).catch(error => console.error(error));
  setTimeout(issMapUpdate, 5000);
}

function getUserAddress(location) {
  $.get('/userAddress', { data: location })
    .then(address => {
      console.log('user address', address);
      userLoc.address = address;
    }).catch(error => console.error(error));


}
function getWeather() {
  $.ajax({
    url: '/userLoc',
    method: 'GET'
  })
    .then(location => {
      userLoc.lat = location.lat;
      userLoc.lng = location.lng;

      return $.get('/weather', { data: location })
    })
    .then(results => {
      console.log('current forecast ' + results.forecast)
      console.log('visibility is ' + results.visibility)
      console.log('windgusts are ' + results.windGust)
      console.log('on the minute ' + results.minutely)
      console.log('hourly forecast ' + results.hourly)
      console.log('daily forecast ' + results.daily)
    })
    .catch(error => console.error(error))
}
getWeather();

$('#searchForm').on('submit', getSearchLoc);

function getSearchLoc(event) {
  event.preventDefault();
  let input = $('#inputLoc').val();
  console.log('input: ', input);

  $.ajax({
    url: '/search',
    method: 'GET',
    data: { data: input }
  })
    .then(location => {
      locationCoords.lat = location.lat;
      locationCoords.lng = location.lng;

      console.log('A: ', issCoords);
      console.log('B: ', locationCoords);

      let pointA = new google.maps.LatLng(issCoords.lat, issCoords.lng);
      let pointB = new google.maps.LatLng(locationCoords.lat, locationCoords.lng);

      $('#location').text(`Coordinates of ${location.address}: ${location.lat}, ${location.lng}`);
      let distance = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(pointA, pointB));
      console.log('distance: ', distance);
      $('#distance').text(`Distance between ${location.address} and ISS is ${distance} meters.`);
    }).catch(error => console.error(error));
}




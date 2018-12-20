'use strict';

let issCoords = {};
let userLoc = {};
let locationCoords = {};
let issMarker;
let issCirc;
let mymap;
let range = 0;

// Get ISS coordinates then create map with ISS marker
async function makeMap() {
  $.ajax({
    url: '/issLoc',
    method: 'GET',
  })
    .then(issLoc => {
      issCoords.lat = issLoc[0].issLat;
      issCoords.lng = issLoc[0].issLng;
      mymap = L.map('map').setView([issCoords.lat, issCoords.lng], 2);
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWJnb3NlY28iLCJhIjoiY2pwdTNoZGh0MGNvejQybWhxMThsNXc0OCJ9.LShDX_H_VSZYAOy_vQD-nQ', {
        maxZoom: 18,
        id: 'mapbox.streets'
      }).addTo(mymap);
    let ISSicon = L.icon({
      iconUrl: '/styles/icons/ISS-icon.png',
      iconSize: [55, 55],
    });
      issMarker = L.marker([issCoords.lat, issCoords.lng], {icon: ISSicon}).addTo(mymap);
      issCirc = L.circle([issCoords.lat, issCoords.lng], {radius: 2270000, color: 'red', weight: 1, fillColor: '#f03', fillOpacity: 0.15}).addTo(mymap);
      issMapUpdate();
    }).catch(error => console.error(error));
  console.log('ISS coords: ', issCoords);
}

// Get user coordinates, determine range between user and ISS, then display results
async function getUserData() {
 await $.ajax({
    url: '/userLoc',
    method: 'GET'
  })
    .then(location => {
      userLoc.lat = location.lat;
      userLoc.lng = location.lng;
      return $.get('/userAddress', { data: location })
    })
    .then(address => {
      userLoc.address = address;
      console.log('address: ', address);

      range = checkRange(userLoc.lat, userLoc.lng);
      console.log('range: ', range);

      $('#left-ul').text(`Current weather for ${userLoc.address}:`);
      if (range <= 2270000) {
        $('#mid-ul').text(`Your current location at ${userLoc.address} is currenty in viewable range. Go grab a telescope and look for it!  The next passes are on:`);
      } else {
        $('#mid-ul').text(`You current location at ${userLoc.address} is not in viewable range of the ISS. The next passes will be on:`);
      }
    })
    .catch(error => console.error(error));

  // Appends ISS pass date/times to results
  await $.ajax({
    url: '/userLoc',
    method: 'GET'
  })
    .then(location => {
      userLoc.lat = location.lat;
      userLoc.lng = location.lng;
      return $.get('/issPasses', {data: location})
    })
    .then(passes => {
      console.log('passes: ', passes.response);
      passes.response.forEach(d => {
        let date = new Date(d.risetime*1000);
        $('#mid-ul').append(`<li>${date}</li>`);
      });
    })
    .catch(error => console.error(error));
}

console.log('user location: ', userLoc);

// Updates the map every 5 seconds
async function issMapUpdate() {
  await $.ajax({
    url: '/issLoc',
    method: 'GET',
  })
    .then(issLoc => {
      issCoords.lat = issLoc[0].issLat;
      issCoords.lng = issLoc[0].issLng;

      issMarker.setLatLng([issCoords.lat, issCoords.lng]);
      issCirc.setLatLng([issCoords.lat, issCoords.lng]);

    })
    .catch(error => console.error(error));
  setTimeout(issMapUpdate, 5000);
}

// Gets a list of the current ISS crew
async function getCrew() {
  await $.ajax({
    url: '/issCrew',
    method: 'GET',
  })
    .then(crew => {
      crew.forEach(person => {
        $('#right-ul').append(`<li class="fadeIn">${person.name}</li>`);
      });
    })
    .catch(error => console.error(error));
}

// Gets the current weather conditions for the user's location
async function getWeather() {
  await $.ajax({
    url: '/userLoc',
    method: 'GET'
  })
    .then(location => {
      userLoc.lat = location.lat;
      userLoc.lng = location.lng;

      return $.get('/weather', { data: location })
    })
    .then(results => {
      $('#left-ul').children().remove();
      $('#left-ul').append(`<li class="fadeIn">Your current forecast is ${results.forecast}</li>`);
      if (results.forecast === 'Mostly Cloudy') {
        $('#weather').attr('src', '/styles/assets/cloudy.gif');
      } else if (results.forecast === 'Overcast') {
        $('#weather').attr('src', '/styles/assets/overcast.png');
      } else if (results.forecast === 'Rain') {
        $('#weather').attr('src', '/styles/assets/rain.png');
      }
      $('#left-ul').append(`<li class="fadeIn">With a current visibility of ${results.visibility}</li>`);
      $('#left-ul').append(`<li class="fadeIn">Your current hourly forecast is ${results.hourly}</li>`);
      $('#left-ul').append(`<li class="fadeIn">Your current daily summary is ${results.daily}</li>`);
    })
    .catch(error => console.error(error))
}

// Measures distance in meters of geodesic line between ISS ground point and given location
function checkRange(lat, lng) {
  let pointA = new google.maps.LatLng(issCoords.lat, issCoords.lng);
  let pointB = new google.maps.LatLng(lat, lng);

  let distance = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(pointA, pointB));
  console.log('distance: ', distance);
  return distance;
}

makeMap();
getUserData();
getCrew();
getWeather();

// On search submit, get location data, measure distance to ISS, and show results if visible or not
$('#searchForm').on('submit', getSearchLoc);

async function getSearchLoc(event) {
  event.preventDefault();
  window.location = '#map';
  let input = $('#inputLoc').val();
  console.log('input: ', input);

  // Get ISS location
  await $.ajax({
    url: '/issLoc',
    method: 'GET',
  })
    .then(issLoc => {
      issCoords.lat = issLoc[0].issLat;
      issCoords.lng = issLoc[0].issLng;

      issMarker.setLatLng([issCoords.lat, issCoords.lng]);
      issCirc.setLatLng([issCoords.lat, issCoords.lng]);

    }).catch(error => console.error(error));

  // Then get search location and measure distance, then display results
  await $.ajax({
    url: '/search',
    method: 'GET',
    data: {data: input}
  })
    .then(location => {
      locationCoords.lat = location.lat;
      locationCoords.lng = location.lng;
      locationCoords.address = location.address;
      let searchMarker = L.marker([location.lat, location.lng]).addTo(mymap);
      mymap.flyTo([location.lat, location.lng], 3);

      let range = checkRange(location.lat, location.lng);
      console.log('search address: ', locationCoords.address);

      if (range <= 2270000) {
        $('#mid-ul').text(`Your search at ${location.address} is currenty in viewable range. Go grab a telescope and look for it! The next passes are on:`);
      } else {
        $('#mid-ul').text(`Your search at ${location.address} is not in viewable range of the ISS. The next passes will be on:`);
      }
    }).catch(error => console.error(error));

  // Then append next ISS passes to results
    await $.ajax({
      url: '/issPasses',
      method: 'GET',
      data: {data: locationCoords}
    })
    .then(passes => {
      $('#mid-ul').children().remove();
      console.log('passes: ', passes.response);
      passes.response.forEach(d => {
        let date = new Date(d.risetime*1000);
        $('#mid-ul').append(`<li class="fadeIn">${date}</li>`);
      });
    })
    .catch(error => console.error(error));

  // And get weather for searched location
  $.ajax({
    url: '/weather',
    method: 'GET',
    data: {data: locationCoords}
    })
    .then(results => {
      $('#left-ul').text(`Current weather for ${locationCoords.address}:`);
      $('#left-ul').children().remove();
      $('#left-ul').append(`<li class="fadeIn">Your current forecast is ${results.forecast}</li>`);
      if (results.forecast === 'Mostly Cloudy') {
        $('#weather').attr('src', '/styles/assets/cloudy.gif');
      } else if (results.forecast === 'Overcast') {
        $('#weather').attr('src', '/styles/assets/overcast.png');
      } else if (results.forecast === 'Rain') {
        $('#weather').attr('src', '/styles/assets/rain.png');
      }
      $('#left-ul').append(`<li class="fadeIn">With a current visibility of ${results.visibility}</li>`);
      $('#left-ul').append(`<li class="fadeIn">Your current hourly forecast is ${results.hourly}</li>`);
      $('#left-ul').append(`<li class="fadeIn">Your current daily summary is ${results.daily}</li>`);
    })
    .catch(error => console.error(error))  
}

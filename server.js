'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const superagent = require('superagent');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

app.set('view engine', 'ejs');

require('dotenv').config();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

// Error handler
function handleError(err, res) {
  console.error('ERROR', err);
  res.render('./error', {error: 'Something went wrong! Please refresh your page.'});
}

app.get('/', (req, res) => {
  res.render('./planet');
});
app.get('/home', (req, res) => {
  res.render('./index');
});
app.get('/userLoc', getUserLoc);
app.get('/userAddress', getUserAddress);
app.get('/issLoc', getISSLoc);
app.get('/issPasses', getPasses);
app.get('/search', getInputLoc);
app.get('/weather', getWeather );
app.get('/issCrew', getCrew);
app.get('*', (req, res) => res.status(404).send('404 Page not found'));

function getWeather(req,res) {
  console.log('made it to the weather function');

  let weatherinfo = req;
  console.log(weatherinfo);
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${req.query.data.lat},${req.query.data.lng}`;

  return superagent.get(url)
    .then(data => {
      const weatherSummaries = new Weather(data.body);
      console.log(data.body);
      return weatherSummaries;
    })
    .then(results => {
      res.send(results);
    })
    .catch(error => handleError(error, res));
}

function getUserLoc(req, res) {
  const url = `https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.GOOGLE_API_KEY}`;
  return superagent.post(url)
    .then(data => {
      const results = new UserLoc(data.body.location);
      return results;
    })
    .then(user => {
      res.send(user);
    })
    .catch(error => handleError(error, res));
}

function getUserAddress(req, res) {
  console.log('got to user address');
  let loc = req.query.data;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.lat},${loc.lng}&key=${process.env.GOOGLE_API_KEY}`
  return superagent.get(url)
    .then(data => {
      const address = data.body.results[0].formatted_address;
      return address;
    })
    .then(address => {
      console.log(address);
      res.send(address);
    })
    .catch(error => handleError(error, res));
}

function getISSLoc(req, res) {
  console.log('got to ISS');
  const url = 'http://api.open-notify.org/iss-now';
  return superagent.get(url)
    .then(data => {
      const issLoc = new ISS(data.body);
      console.log(issLoc);
      return issLoc;
    })
    .then(iss => {
      res.send([iss]);
    })
    .catch(error => handleError(error, res));
}

function getPasses(req, res) {
  console.log('got to ISS passes');
  let loc = req.query.data;
  const url = `http://api.open-notify.org/iss-pass.json?lat=${loc.lat}&lon=${loc.lng}&n=5`;
  return superagent.get(url)
    .then(data => {
      const result = data.body;
      res.send(result);
    })
    .catch(error => handleError(error, res));
}

function getInputLoc(req, res) {
  console.log('got to search')
  let input = req.query.data;
  const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${input}&key=${process.env.GOOGLE_API_KEY}`;
  return superagent.get(URL)
    .then(data => {
      if (!data.body.results.length) {
        res.redirect('./error');
      } else {
        let location = new Location(data.body.results[0]);
        console.log(location);
        return location;
      }
    })
    .then(loc => {
      console.log(loc);
      res.send(loc);
    }).catch(error => handleError(error, res));
}

function getCrew(req, res) {
  console.log('got to Crew');
  const url = 'http://api.open-notify.org/astros.json';
  return superagent.get(url)
    .then(data => {
      const crew = data.body.people;
      res.send(crew);
    })
    .catch(error => handleError(error, res));
}

// Models

function UserLoc(data) {
  this.lat = data.lat;
  this.lng = data.lng;
}

function ISS(data) {
  this.issLat = data.iss_position.latitude;
  this.issLng = data.iss_position.longitude;
}

function Location(data) {
  this.address = data.formatted_address;
  this.lat = data.geometry.location.lat;
  this.lng = data.geometry.location.lng;
}

function Weather(data) {
  this.forecast = data.currently.summary;
  this.visibility = data.currently.visibility;
  this.minutely = data.minutely.summary;
  this.hourly = data.hourly.summary;
  this.daily = data.daily.summary;
  this.icon = data.currently.icon;
}


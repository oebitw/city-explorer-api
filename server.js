'use strict';

///////////////////////
// Dependencies     //
/////////////////////

//DOTENV (read our environment variable)
require('dotenv').config();

// Express Frame work
const express = require('express');

//CORS = Cross Origin Resource Sharing
const cors = require('cors');

// client-side HTTP request library
const superagent = require('superagent');


/////////////////////////////
//// Application Setup    //
///////////////////////////

const PORT = process.env.PORT || 3030;
const app = express();
app.use(cors());


////////////////////
//// Routes   /////
//////////////////

app.get('/', homeRouteHandler);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/parks', parksHandler);
app.get('*', notFoundHandler);



////////////////////////////
//// Routes Handler ///////
//////////////////////////

// Home Handler
// http://localhost:3000

function homeRouteHandler(request, response) {
  response.status(200).send('Welcome to City Explorer App');
}


// Location Handler
//http://localhost:3000/location?city=amman

function locationHandler(req, res) {
  // get data from api server (locationIQ)
  // send a request using superagent library (request url + key)
  console.log(req.query);
  let cityName = req.query.city;
  console.log(cityName);
  let key = process.env.LOCATION_KEY;
  let LocURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

  superagent.get(LocURL) //send request to LocationIQ API
    .then(geoData => {
      console.log(geoData.body);
      let gData = geoData.body;
      const locationData = new Location(cityName, gData);
      res.send(locationData);
    })
    .catch(error => {
      console.error(error);
      res.send(error);
    });

}

// WEATHER HANDLER
//http://localhost:3000/parks?search_query=seattle&formatted_query=Seattle%2C%20King%20County%2C%20Washington%2C%20USA&latitude=47.6038321&longitude=-122.3300624&page=1

function weatherHandler (req,res){

  let cityName = req.query.search_query;

  let key = process.env.WEATHER_KEY ;

  let weatherURL=`https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`;

  superagent.get(weatherURL).then(weatherData => {


    let weatherDataBody= weatherData.body;

    // let weatherDaily=[];

    let correctData= weatherDataBody.data.map( e => {

      return new Weather(e);

    });

    res.send(correctData);

  })

    .catch(error => {
      console.error(error);
      res.send(error);
    });

}

// PARKS HANDLER
// http://localhost:3000/parks?search_query=seattle&formatted_query=Seattle%2C%20King%20County%2C%20Washington%2C%20USA&latitude=47.6038321&longitude=-122.3300624&page=1

function parksHandler(req,res){

  console.log(req.query);

  let cityName= req.query.search_query;

  let key = process.env.PARKS_KEY;

  let parksURL= `https://developer.nps.gov/api/v1/parks?q=${cityName}&limit=10&api_key=${key}`;

  superagent.get(parksURL).then(parksData => {

    let parksDataBody = parksData.body;

    let correctData= parksDataBody.data.map(e=>{

      return new Park(e);
    });

    res.send(correctData);

  })
    .catch(error => {
      console.error(error);
      res.send(error);
    });

}


// Error Handler

function notFoundHandler(req, res) {

  res.status(404).send('Not Found');
}



////////////////////////////
//// Constructors   ///////
//////////////////////////

// Location Constructor

function Location(cityName, geoData) {
  this.search_query = cityName;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

// Weather Constructor

function Weather(data){
  this.forecast = data.weather.description;
  this.time = new Date(data.valid_date).toString().slice(0, 15);
}

// Park Constructor

function Park (data){
  this.name= data.fullName;
  //   this.address= data.addresses[0].line1;
  this.address = `${data.addresses[0].line1},  ${data.addresses[0].city}, ${data.addresses[0].stateCode} ${data.addresses[0].postalCode}`;
  this.fee= data.entranceFees[0].cost;
  this.description= data.description;
  this.url = data.url;
}


/////////////////////////////
//// Server Listening   ////
///////////////////////////

app.listen(PORT, ()=>{
  console.log('ACTIVE ON:', PORT);
});

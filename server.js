'use strict';

///////////////////////
// Requiring Modules//
/////////////////////

const express = require('express');

const cors = require('cors');

require('dotenv').config();


/////////////////////////////
//// Initialize the Server//
///////////////////////////

const server = express();

server.use(cors());


//////////////////////
////// Set PORT /////
////////////////////

const PORT = process.env.PORT || 3030;


/////////////////////////////
//// Server Listening   ////
///////////////////////////

server.listen(PORT, ()=>{
  console.log('ACTIVE ON:', PORT);
});


/////////////////////////////
//// Location Route     ////
///////////////////////////

// localhost:3000/location

server.get('/location',(req,res)=>{



  let getLocationData = require('./data/location.json');

  let locationData= new Location ( getLocationData);

  res.status(200).send(locationData);

} );

// Location Constructor

function Location (data){
  this.search_query = 'Lynnwood';
  this.formatted_query = data[0].display_name;
  this.latitude = data[0].lat;
  this.longitude = data[0].lon;
}


/////////////////////////////
//// Weather Route    //////
///////////////////////////

// localhost:3000/weather

server.get('/weather', (req,res)=>{


  let weatherData = require('./data/weather.json');

  Weather.all =[];


  weatherData.data.forEach((e) => {

    new Weather(e);

  });

  res.status(200).send(Weather.all);
});

// Weather Constructor

function Weather(data){
  this.forecast = data.weather.description;
  this.time = new Date(data.valid_date).toString().slice(0, 15);
  Weather.all.push(this);
}
Weather.all=[];

/////////////////////////////
//// 500 error        //////
///////////////////////////

server.get('*', (req,res)=>{
  let errorObj = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  res.status(500).send(errorObj);
});




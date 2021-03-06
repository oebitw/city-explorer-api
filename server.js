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

// postgress

const pg = require('pg');
const { head } = require('superagent');



/////////////////////////////
//// Application Setup    //
///////////////////////////

const PORT = process.env.PORT || 3030;
const app = express();
app.use(cors());
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
// const client = new pg.Client(process.env.DATABASE_URL);


////////////////////
//// Routes   /////
//////////////////

app.get('/', homeRouteHandler);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/parks', parksHandler);
app.get('/yelp', yelpHandler);
app.get('/movies', moviesHandler);
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

  let cityName = req.query.city;
  let key = process.env.LOCATION_KEY;
  let LocURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
  let SQL = `SELECT * FROM locations WHERE search_query = '${cityName}';`;

  client.query(SQL).then( locationData =>{
    if( locationData.rows.length===0){
      superagent.get(LocURL) //send request to LocationIQ API
        .then(geoData => {
          let gData = geoData.body;
          const locationData = new Location(cityName, gData);

          console.log(locationData , '1111111111111');


          const addData = `INSERT INTO locations(search_query, formatted_query, latitude, longitude) VALUES ($1,$2,$3,$4);`;
          let safeValues = [cityName, locationData.formatted_query, locationData.latitude, locationData.longitude];

          client.query(addData, safeValues)
            .then(() => {
              res.status(200).send(locationData);
            });

        }) .catch(() => {

          res.status(404).send('Page Not Found: There is no Data, Try another City Please.');

        });

    } else if (locationData.rows[0].search_query === cityName){

      console.log(locationData , '222222222');

      res.status(200).send(locationData.rows[0]);

    }
  }) .catch(error => {
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

// YELP HANDLER
// http://localhost:3000/yelp?id=2&search_query=seattle&formatted_query=Seattle%2C%20King%20County%2C%20Washington%2C%20USA&latitude=47.6038321&longitude=-122.3300624&page=1


function yelpHandler (req,res){


  let cityName=req.query.search_query;

  let pageNum= req.query.page;

  let key= process.env.YELP_KEY;

  let numPerPage=5;

  let index=((pageNum-1) * numPerPage +1);

  let yelpURL= `https://api.yelp.com/v3/businesses/search?location=${cityName}&limit=${numPerPage}&offset=${index}`;

  superagent.get(yelpURL).set(`Authorization`, `Bearer ${key}`).then(yelpData =>{



    let yelpDataBody = yelpData.body;

    // res.send(yelpDataBody);

    let correctData = yelpDataBody.businesses.map(e=>{
      return new Yelp(e);
    });

    res.status(200).send(correctData);

  }).catch(error => {
    res.send(error);
  });
}

// Movies Handler
//http://localhost:3000/movies?id=2&search_query=seattle&formatted_query=Seattle%2C%20King%20County%2C%20Washington%2C%20USA&latitude=47.6038321&longitude=-122.3300624&page=1

function moviesHandler(req,res){
  let cityName= req.query.search_query;

  let key = process.env.MOVIES_KEY;

  let moviesURL=`https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${cityName}`;

  superagent.get(moviesURL).then(moviesData=>{

    let moviesDataBody=moviesData.body;

    let correctData = moviesDataBody.results.map( e=>{
      return new Movie (e);
    });

    res.status(200).send(correctData);


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

// YELP CONSTRUCTOR

function Yelp (data){

  this.name=data.name;
  this.image_url=data.image_url;
  this.price= data.price;
  this.rating=data.rating;
  this.url=data.url;

}

// MOVIES CONSTRUCTOR

function Movie (data){

  this.title=data.original_title;

  this.overview=data.overview;

  this.average_votes=data.vote_average;

  this.total_votes=data.vote_count;

  this.image_url=`https://image.tmdb.org/t/p/w500${data.poster_path}`;

  this.popularity=data.popularity;

  this.released_on= data.release_date;

}

/////////////////////////////
//// Server Listening   ////
///////////////////////////

// app.listen(PORT, ()=>{
//   console.log('ACTIVE ON:', PORT);
// });
client.connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  });

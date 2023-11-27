import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import passport from 'passport';
import session from 'express-session';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import fs from 'fs';

import { searchFlights } from './integrations/amadeus.js';
import { makeItinerary } from './integrations/openai.js';
import { searchAirportsFuzzy } from './utils/search-name.js';

const app = express();
const port = 3000;

app.use(cors());
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.AMADEUS_CLIENT_SECRET  
}));

/* Middleware auth */

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res) {
  res.render('pages/auth');
});

const isLoggedIn = (req, res, next) => {
  if (req.user) next();
  else res.sendStatus(401);
}

/* Front Routes */

app.get('/search', isLoggedIn, (req, res) => {
  res.render('index', { flights: [] });
});

/* Travel routes */

app.get('/results', function(req, res) {
  // Read the contents of the payload.txt file
  fs.readFile('payload.txt', 'utf8', function(err, data) {
    if (err) {
      console.error('Error reading the payload.txt file:', err);
      return res.status(500).send('Error loading flight data');
    }

    try {
      // Parse the JSON data
      const payloadData = JSON.parse(data);

      // Process the data to fit the format required by your EJS template
      const flights = payloadData.data.map((offer) => {
        // Extract the necessary details from each flight offer
        // This is just an example, adjust the properties according to your payload structure
        const segmentsLength = offer.itineraries[0].segments.length
        const stops = offer.itineraries[0].segments.filter((s, idx, arr)=> arr[0].departure.iataCode != arr[idx].departure.iataCode).map(s => s.departure.iataCode) 
        console.log(offer.itineraries[0].segments.map(s => s.departure.iataCode) )
        return {
          id: offer.id,
          airline: offer.itineraries[0].segments[0].carrierCode,
          departureTime: offer.itineraries[0].segments[0].departure.at,
          arrivalTime: offer.itineraries[0].segments[segmentsLength-1].arrival.at,
          duration: offer.itineraries[0].duration,
          departureAirport: offer.itineraries[0].segments[0].departure.iataCode,
          arrivalAirport: offer.itineraries[0].segments[segmentsLength-1].arrival.iataCode,
          direct: offer.itineraries[0].segments.length === 1,
          price: offer.price && offer.price.total, // Assuming there is a price object
          airlineCode:  offer.itineraries[0].segments[0].carrierCode,
          stops
        };
      });

      // Render the EJS template with the flights data
      res.render('index', { flights: flights });

    } catch (error) {
      console.error('Error parsing JSON from payload.txt:', error);
      return res.status(500).send('Error parsing flight data');
    }
  });
});

app.get('/flights', isLoggedIn, async (req, res) => {
  console.log("GET /flights");
  const flightsData = await searchFlights(req.query);
  const flights = flightsData.data.map((offer) => {
    // Extract the necessary details from each flight offer
    // This is just an example, adjust the properties according to your payload structure
    const segmentsLength = offer.itineraries[0].segments.length
    const stops = offer.itineraries[0].segments.filter((s, idx, arr)=> arr[0].departure.iataCode != arr[idx].departure.iataCode).map(s => s.departure.iataCode) 
    console.log(offer.itineraries[0].segments.map(s => s.departure.iataCode) )
    return {
      id: offer.id,
      airline: offer.itineraries[0].segments[0].carrierCode,
      departureTime: offer.itineraries[0].segments[0].departure.at,
      arrivalTime: offer.itineraries[0].segments[segmentsLength-1].arrival.at,
      duration: offer.itineraries[0].duration,
      departureAirport: offer.itineraries[0].segments[0].departure.iataCode,
      arrivalAirport: offer.itineraries[0].segments[segmentsLength-1].arrival.iataCode,
      direct: offer.itineraries[0].segments.length === 1,
      price: offer.price && offer.price.total, // Assuming there is a price object
      airlineCode:  offer.itineraries[0].segments[0].carrierCode,
      stops
    };
  });
  res.render('index', { flights: flights });
});

app.get('/itinerary', isLoggedIn, async (req, res) => {
  console.log("GET /itinerary");
  const { departureDate, returnDate, destinationLocationCode } = req.query;
  const [{ municipality: destination }] = searchAirportsFuzzy(destinationLocationCode);
  const itinerary = await makeItinerary(destination, departureDate, returnDate);
  res.status(200).send(itinerary);
})

/* Passport Auth */

let userProfile;

app.get('/success', isLoggedIn, (req, res) => res.status(200).render('success', { user: userProfile }));
app.get('/error', (req, res) => res.status(401).send("Error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

/*  Google AUTH  */
 
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    passReqToCallback: true
  },
  (req, accessToken, refreshToken, profile, done) => {
    userProfile = profile;
    return done(null, userProfile);
}));
 
app.get('/auth/google', 
  passport.authenticate('google', { scope : ['profile', 'email'] }));
 
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/success');
  });

/* Starting Server */

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
})
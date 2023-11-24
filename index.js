import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import passport from 'passport';
import session from 'express-session';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';

import { searchFlights } from './integrations/amadeus.js';
import { makeItinerary } from './integrations/openai.js';
import { searchAirportsFuzzy } from './utils/search-name.js';

const app = express();
const port = 3000;

app.use(cors());
app.set('view engine', 'ejs');
app.set('views', './views');

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
  res.render('index');
});

/* Travel routes */

app.get('/flights', isLoggedIn, async (req, res) => {
  console.log("GET /flights");
  const flightsData = await searchFlights(req.query);
  res.status(200).send(flightsData);
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
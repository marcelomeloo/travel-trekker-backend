import express from 'express';
import cors from 'cors';
import { searchFlights } from './integrations/amadeus.js';
import { makeItinerary } from './integrations/openai.js';
import { searchAirportsFuzzy } from './utils/search-name.js';

const app = express();
app.use(cors());
const port = 3000;

app.get('/flights', async (req, res) => {
  console.log("called /flights");
  const flightsData = await searchFlights(req.query);
  res.status(200).send(flightsData);
});

app.get('/itinerary', async (req, res) => {
  console.log("called /itinerary");
  const { departureDate, returnDate, destinationLocationCode } = req.query;
  const [{ municipality: destination }] = searchAirportsFuzzy(destinationLocationCode);
  const itinerary = await makeItinerary(destination, departureDate, returnDate);
  res.status(200).send(itinerary);
})

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
})
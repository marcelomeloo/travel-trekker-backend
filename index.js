import express from 'express';
import cors from 'cors';
import { searchFlights } from './integrations/amadeus.js';

const app = express();
app.use(cors());
const port = 3000;

app.get('/flights', async (req, res) => {
  const flights = await searchFlights(req.query);
  res.send(flights);
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
})
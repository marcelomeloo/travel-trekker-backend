import axios from 'axios';
import 'dotenv/config'

const authenticate = async () => {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.AMADEUS_CLIENT_ID);
  params.append('client_secret', process.env.AMADEUS_CLIENT_SECRET);
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  const { data } = await axios.post(process.env.AMADEUS_AUTH_URL, params, { headers })

  return data.access_token;
}

export const searchFlights = async (params) => {
  const token = await authenticate();
  const headers = { 'Authorization': `Bearer ${token}` }
  const { data } = await axios.get(
    `${process.env.AMADEUS_BASE_URL}/shopping/flight-offers`,
    { params, headers }
  )
  return data;
}

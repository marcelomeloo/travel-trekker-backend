const url = "http://localhost:3000";

const originInput = document.getElementById("origin-input");
const originOptions = document.getElementById("origin-options");
const destinationInput = document.getElementById("destination-input");
const destinationOptions = document.getElementById("destination-options");
const flightTypeSelect = document.getElementById("flight-type-select");
const departureDateInput = document.getElementById("departure-date-input");
const returnDate = document.getElementById("return-date");
const returnDateInput = document.getElementById("return-date-input");
const travelClassSelect = document.getElementById("travel-class-select");
const adultsInput = document.getElementById("adults-input");
const childrenInput = document.getElementById("children-input");
const infantsInput = document.getElementById("infants-input");
const searchButton = document.getElementById("search-button");
const flights = document.getElementById("flights");
const itinerary = document.getElementById("itinerary");

const reset = () => {
  originInput.value = "";
  destinationInput.value = "";
  flightTypeSelect.value = "one-way";
  departureDateInput.valueAsDate = new Date();
  returnDateInput.valueAsDate = new Date();
  returnDate.classList.add("d-none");
  travelClassSelect.value = "ECONOMY";
  adultsInput.value = 1;
  childrenInput.value = 0;
  infantsInput.value = 0;
  searchButton.disabled = true;
};

document.body.addEventListener("input", () => {
  searchButton.disabled = !originInput.value || !destinationInput.value;
});

// originInput.addEventListener("input", () => {
//   // autocomplete
// });
// destinationInput.addEventListener("input", () => {
//   // autocomplete
// });

flightTypeSelect.addEventListener("change", () => {
  if (flightTypeSelect.value === "one-way") {
    returnDate.classList.add("d-none");
  } else {
    returnDate.classList.remove("d-none");
  }
});

searchButton.addEventListener("click", async () => {
  const returnDate = (flightTypeSelect.value === "one-way") ?
  null : returnDateInput.value;
  const params = {
    ...{
    originLocationCode: originInput.value,
    destinationLocationCode: destinationInput.value,
    departureDate: departureDateInput.value,
    travelClass: travelClassSelect.value,
    adults: adultsInput.value,
    nonStop: false,
    currencyCode: 'BRL',
    max: 5
    },
    ...(returnDate && { returnDate })
  }

  const [
    {data: itineraryResponse},
    {data: flightsResponse}
  ] = await Promise.all([
    axios.get(`${url}/itinerary`, { params }),
    axios.get(`${url}/flights`, { params })
  ]);
  // console.log(itineraryResponse);
  console.log(flightsResponse);
  flights.innerHTML = flightsResponse;
  itinerary.innerHTML = itineraryResponse;
});

reset();
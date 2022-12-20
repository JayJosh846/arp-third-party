const express = require('express');
const { externalTokenAuth } = require('../middleware/authorizeToken');
const { checkoutLink, createExternalAPIKey } = require('../controllers/index')
const  { getAllFlights,  getAllBookedFlight, getBookedFlightByFlightCode, getAllCanceledFlights,
    getCanceledFlightsByFlightCode, passengerCheckin } = require('../controllers/getters')
const router = express.Router();



router.post("/create-token", createExternalAPIKey); 
router.post("/initialize-payment", externalTokenAuth, checkoutLink);


router.get("/flights/", externalTokenAuth, getAllFlights)
router.get("/booked-flights/", externalTokenAuth, getAllBookedFlight)
router.get("/booked-flights/:flightCode", externalTokenAuth, getBookedFlightByFlightCode)
router.get("/cancelled-flights/", externalTokenAuth, getAllCanceledFlights)
router.get("/cancelled-flights/:flightCode", externalTokenAuth, getCanceledFlightsByFlightCode)
router.get("/checkedin-flights/:airlineName", externalTokenAuth, passengerCheckin)


module.exports = router;

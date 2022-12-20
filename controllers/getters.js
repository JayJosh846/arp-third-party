// const { validateId, getAUserById } = require("../utils/utils")
// const { balanceOf } = require("../../web3Services/web3.services");
// const { parse } = require("url");

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

// return res.status(200).json({ status: "success", data: airlineList });


const getAllFlights = async (req, res) => {

  const airline = await prisma.airline.findUnique({
    where: {
      apiKey: req.headers['api-key']
    }
  })

  try {
    const flight = await prisma.flight.findMany(
      {
        where: {
          airlineName: airline.airlineName
      }
    }
    );
    return res.status(200).json({ status: "success", data: flight });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getAllBookedFlight = async (req, res) => {

  const airline = await prisma.airline.findUnique({
    where: {
      apiKey: req.headers['api-key']
    }
  })

  try {
    const flight = await prisma.booked.findMany(
      {
        where: {
          airlineName: airline.airlineName,
      }
    }
    );
    return res.status(200).json({ status: "success", data: flight });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getBookedFlightByFlightCode = async (req, res) => {

  const { flightCode } = req.params;

  const airline = await prisma.airline.findUnique({
    where: {
      apiKey: req.headers['api-key']
    }
  })

  try {
    const flight = await prisma.booked.findMany(
      {
        where: {
          airlineName: airline.airlineName,
          flightCode: flightCode
      }
    }
    );
    return res.status(200).json({ status: "success", data: flight });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};


const getAllCanceledFlights = async (req, res) => {

  const airline = await prisma.airline.findUnique({
    where: {
      apiKey: req.headers['api-key']
    }
  })

  try {
    const flight = await prisma.passengercancel.findMany(
      {
        where: {
          airlineName: airline.airlineName,          
      }
    }
    );
    return res.status(200).json({ status: "success", data: flight });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};


const getCanceledFlightsByFlightCode = async (req, res) => {

  const { flightCode } = req.params;

  const airline = await prisma.airline.findUnique({
    where: {
      apiKey: req.headers['api-key']
    }
  })

  try {
    const flight = await prisma.passengercancel.findMany(
      {
        where: {
          airlineName: airline.airlineName,
          flightCode: flightCode

          
      }
    }
    );
    return res.status(200).json({ status: "success", data: flight });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const passengerCheckin = async (req, res) => {

  const { airlineName } = req.params;

  try {
    const flight = await prisma.passengercheckin.findMany(
      {
        where: {
          airlineName: airlineName
      }
    }
    );
    return res.status(200).json({ status: "success", data: flight });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

 
module.exports = {
  getAllFlights,
  getAllBookedFlight,
  getBookedFlightByFlightCode,
  getAllCanceledFlights,
  getCanceledFlightsByFlightCode,
  passengerCheckin
};

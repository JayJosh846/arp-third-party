const Axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const baseURL = process.env.WEB3_BASE_URL;

const createPassenger = async () => {
  let resp;
  await Axios.post(`${baseURL}/aeropaye/operations/create-account`)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-create-passenger", error.message);
    });
  return resp;
};

const mintToken = async (value, mintTo) => {

  const data = {
    value, 
    mintTo
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/tokens/mint`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-mint-token", error.message);
    });
  return resp;
};


const transferEscrow = async (flightEscrow, airline, passenger, amount, flightClassPassenger, flightStatusPassenger, flightSeatPassenger, passengerPswd) => {

  const data = {
    flightEscrow, 
    airline, 
    passenger, 
    amount, 
    flightClassPassenger, 
    flightStatusPassenger,
    flightSeatPassenger, 
    passengerPswd
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/transfer-escrow`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-transfer-to-escrow", error.message);
    });
  return resp;
};



const cancelBooking = async (flightEscrow, passenger, keyId, passengerPswd) => {

  const data = {
     flightEscrow, 
    passenger, 
    keyId,
    passengerPswd
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/cancel-booking`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-cancel-booking", error.message);
    });
  return resp;
};


const passengerClaim = async (flightEscrow, passenger, keyId, passengerPswd) => {

  const data = {
    flightEscrow, 
    passenger, 
    keyId,
    passengerPswd
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/passenger-claim`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-passenger-claim", error.message);
    });
  return resp;
};



const passengerCheckIn = async (flightEscrow, passenger, keyId, passengerPswd) => {

  const data = {
    flightEscrow, 
    passenger, 
    keyId,
    passengerPswd
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/check-in`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-passenger-checkin", error.message);
    });
  return resp;
};

const balanceOf = async (address) => {


  let resp;

  await Axios.get(`${baseURL}/aeropaye/balance/${address}`)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-balanceOf", error.message);
    });
  return resp;
};

const transfer = async (senderaddr, senderpwsd, recipientaddr, amount) => {

  const data = {
    senderaddr, 
    senderpwsd, 
    recipientaddr,
    amount
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/tokens/transfer`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-transfer", error.message);
    });
  return resp;
};


const airlineClaimBookingFee = async (flightEscrow, escrowKey, airline, airlinePswd) => {

  const data = {
    flightEscrow,
    escrowKey,
    airline,
    airlinePswd
  }

let resp;

  await Axios.post(`${baseURL}/aeropaye/airline-claim-fee`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-airline-claim-booking-fee", error.message);
    });
  return resp;
};

const airlineEscrow = async (airline) => {
  let resp;

  await Axios.get(`${baseURL}/aeropaye/airline-escrows/${airline}`)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-airlineEscrow", error.message);
    });
  return resp;
};


const escrowCreationPayment = async (airline, airlinePswd, flightCode, flightDeparture, flightArrival, flightTime ) => {

  const data = {
    airline,
    airlinePswd,
    flightCode,
    flightDeparture,
    flightArrival,
    flightTime
  }
  let resp;

  await Axios.post(`${baseURL}/aeropaye/create-escrow-payment`, data)

  .then((result) => {
    resp = result.data
    // console.log(resp)
  })

  .catch((error) => {
    // resp = error.response.data;
    console.log("web3-escrow-creation", error.message);
  })
 
     
  return resp;
};


const transferEscrowPayment = async (flightEscrow, airline, passenger, amount, flightClassPassenger, flightStatusPassenger, flightSeatPassenger, passengerPswd) => {

  const data = {
    flightEscrow, 
    airline, 
    passenger, 
    amount, 
    flightClassPassenger, 
    flightStatusPassenger,
    flightSeatPassenger, 
    passengerPswd
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/transfer-escrow-payment`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-transfer-to-escrow", error.message);
    });
  return resp;
};

const addUserList = async ( address ) => {

  const data = {
     address
  }
  let resp;

  await Axios.post(`${baseURL}/aeropaye/operations/add-user-list`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-add-user-list", error.message);
    });
  return resp;
};




module.exports = {
    createPassenger,
    mintToken,
    transferEscrow,
    cancelBooking,
    passengerClaim,
    passengerCheckIn,
    balanceOf,
    transfer,
    airlineClaimBookingFee,
    airlineEscrow,
    escrowCreationPayment,
    transferEscrowPayment,
    addUserList
}


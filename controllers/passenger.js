const { config } = require("dotenv");
config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uuid } = require('uuidv4');
const { JWT_SECRET, JWT_EXP, getUserId } = require("../src/airlineUtils/auth");
const { sendOTP, verifyOTP } = require("../../termii.token/termii.token");
const { makeFiatDeposit, verifyDepositedFunds, verifyAccountNumber, transferRecipientCreation, initiateTransfer, } = require("../../payment");
const cache = require("../../cache.redis/cache");
const { getAUserById, getAFlightById, isEmailOrMobileExist } = require("../src/airlineUtils/utils");
const { createPassenger, mintToken, transferEscrow, balanceOf, transfer, cancelBooking,
  passengerCheckIn, airlineClaimBookingFee, airlineEscrow, escrowCreationPayment, transferEscrowPayment, addUserList } = require('../../web3Services/web3.services');
const { publishToQueue, consumeFromQueue } = require("../../message.queue/queue")
const { PrismaClient } = require("@prisma/client")
const { UserInputError, ValidationError, AuthenticationError, ForbiddenError } = require("apollo-server");
const { getDanaAirFlights, getAirPeaceFlights, getArikAirFlights } = require("../../Services/Airlines/airlineFlights");
const { getDanaAir, getAirPeace, getArikAir } = require("../../Services/Airlines/airlines");
const { sendConfirmationEmail, sendPasswordResetEmail, sendItinerary } = require('../../emailsAPI/emailServices');
const { setUserKeypair } = require('../../utils/keyPair')
const { setAirlineKeypair } = require('../../utils/airlineUtils/keyPair')
const Str = require('@supercharge/strings')
const { generateCryptoDepositQRCode } = require("../../config/qrCode")
// const { PubSub } = require('graphql-subscriptions');

// let pubsub = new PubSub();


const prisma = new PrismaClient()


const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;


const fakeData = {
  // firstname: "Joel",
  // lastname: "Dara",
  // email: "sola103@mailcuk.com",
  // mobile: "2347040247157",
  // password: "12345678"


  firstname: "Joel",
  lastname: "Man",
  email: "jayjosh846@gmail.com",
  mobile: "2349036075477",
  password:"12345678"

}

async function signupPayment(parent, args, context, info) {
  let flightCodeGenerator = Math.random().toString(36).substring(7, 11);

  const isUniqueUser = await isEmailOrMobileExist(args, context);

  const unique = await context.prisma.user.findMany()



  let result = unique.map(a => a.email);
  const found = result.find(element => element === args.email);

  if (args.email === found) {
    throw new UserInputError('Email or mobile already exists');
  }

  let resultMobile = unique.map(a => a.mobile);
  const foundMobile = resultMobile.find(element => element === args.mobile);

  if (args.mobile === foundMobile) {
    throw new UserInputError('Email or mobile already exists');
  }


  // if (isUniqueUser) {
  //   throw new UserInputError('Email or mobile already exists');
  // } 


  const termiResponse = await sendOTP(args.mobile);
  const { pinId, smsStatus, to } = termiResponse;
  console.log("pinId, smsStatus, to", pinId, smsStatus, to);
  const cached = await cache.setCacheWithExpiration(
    args.mobile,
    1440,
    JSON.stringify(termiResponse)
  );
  if (cached === "OK") {
    const password = await bcrypt.hash(flightCodeGenerator, 10);
    const pair = await setUserKeypair(args.email);
    const user = await context.prisma.user.create({
      data: { ...args, password, addr: pair.address },
    });

    const addToList = await addUserList(pair.address);
    console.log("addUserList", addToList);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    return {
      token,
      user,
      smsTokenStatus: smsStatus,
    };
  }

  // const password = await bcrypt.hash(args.password, 10);
  // const user = await context.prisma.user.create({
  //   data: { ...args, password },
  // });
  // const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  // return {
  //   token,
  //   user,
  //   smsTokenStatus: smsStatus,
  // };

}




async function signupAnd2FAPayment(parent, args, context, info) {

  const unique = await context.prisma.fakedata.findMany({
    where: {
    email: fakeData.email
    }
  })

  let result = unique.map(a => a);
  const found = result.find(({ email }) => email === fakeData.email);

  const termiResponse = await sendOTP(found.mobile);
  const { pinId, smsStatus, to } = termiResponse;
  const cached = await cache.setCacheWithExpiration(
    found.mobile,
    1440,
    JSON.stringify(termiResponse)
  );
  if (cached === "OK") {
    return {
      status: true,
      message: "Token sent"

    }
  }
}




async function authPayment(parent, args, context, info) {

  await context.prisma.fakedata.create({
    data: {
      ...fakeData
    },
  });


  const user = await context.prisma.user.findUnique({
    where: { email: fakeData.email },
  });
  if (!user) {
    return {
      status: false,
      message: "No user found"
    }
  }
  // if (user.role === "ADMIN")
  // {
  //   throw new AuthenticationError("You are an admin. Login through the admin dashboard");

  // }

  const termiResponse = await sendOTP(fakeData.mobile);
  const { pinId, smsStatus, to } = termiResponse;
  const cached = await cache.setCacheWithExpiration(
    fakeData.mobile,
    1440,
    JSON.stringify(termiResponse)
  );
  if (cached === "OK") {
    // const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    return {
      status: true,
      message: "User found"

    }
  }
}

async function verifyMobilePayment(parent, args, context, info) {
  const result = await cache.getCachedItem(args.msisdn);
  if (!result) {

    throw new AuthenticationError("Invalid number");
  }

  const { pinId } = JSON.parse(result);
  const termiResponse = await verifyOTP(pinId, args.pin);

  if (
    termiResponse.verified === false ||
    termiResponse.verified === "Expired" ||
    termiResponse.status == 400
  ) {


    throw new UserInputError('Invalid code entered', {
      argumentName: 'pin'
    });


  } else if (termiResponse.status == 200 || termiResponse.verified) {
    console.log('token', termiResponse);

    const user = await context.prisma.user.findUnique({
      where: {
        mobile: args.msisdn
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    await context.prisma.fakedata.deleteMany({})

    return {
      token,
      user,
    };
  }
}

async function verifyNewUserPayment(parent, args, context, info) {
  let flightCodeGenerator = Math.random().toString(36).substring(7, 11);
  const unique = await context.prisma.fakedata.findMany({
    where: {
    email: fakeData.email
    }
  })

  let results = unique.map(a => a);
  const found = results.find(({ email }) => email === fakeData.email);


  const result = await cache.getCachedItem(args.msisdn);
  if (!result) {

    throw new AuthenticationError("Invalid number");
  }

  const { pinId } = JSON.parse(result);
  const termiResponse = await verifyOTP(pinId, args.pin);

  if (
    termiResponse.verified === false ||
    termiResponse.verified === "Expired" ||
    termiResponse.status == 400
  ) {


    throw new UserInputError('Invalid code entered', {
      argumentName: 'pin'
    });


  } else if (termiResponse.status == 200 || termiResponse.verified) {
    console.log('token', termiResponse);

    const password = await bcrypt.hash(flightCodeGenerator, 10);
    const pair = await setUserKeypair(found.email);
    const userCreate = await context.prisma.user.create({
      data: {
        email: found.email,
        firstname: found.firstname,
        lastname: found.lastname,
        password: password,
        mobile: found.mobile,
        addr: pair.address },
    });

    const addToList = await addUserList(pair.address);
    console.log("addUserList", addToList);

    const user = await context.prisma.user.update({
      where: {
        mobile: args.msisdn,
      },
      data: {
        // addr,
        // pvtKey,
        mobileVerified: true
      },
    });

    const token = jwt.sign({ userId: userCreate.id }, JWT_SECRET);

    await context.prisma.fakedata.deleteMany({})

    return {
      token,
      user,
    };
  }
}







async function bookFlightPayment(parent, args, context, info) {

  const userDetails = await getAUserById(context);

  const danaAir = await getDanaAir(args, context);
  const airPeace = await getAirPeace(args, context);
  const arikAir = await getArikAir(args, context);

  const danaAirDetails = await getDanaAirFlights(args, context);
  const airPeaceDetails = await getAirPeaceFlights(args, context);
  const arikAirDetails = await getArikAirFlights(args, context);
  const pair = await setUserKeypair(userDetails.email);



  let flightCodeGenerator = Math.floor(Math.random() * 1000000);
  let ticker = "";

  ticker = "TK" + flightCodeGenerator;

  // If Dana 

  if (danaAirDetails !== undefined &&
    danaAirDetails.flightCode === args.flightCode) {


    // check if user has enough balance
    const numOfChildren = args.numOfChildren || 0
    const numOfInfants = args.numOfInfants || 0

    const totalNumOfPassengers = args.numOfAdults + numOfChildren + numOfInfants;

    const totalAmount = totalNumOfPassengers * parseInt(args.amount)

    const userBalance = await balanceOf(userDetails.addr);

    if (parseInt(userBalance.data) < totalAmount) {
      throw new UserInputError('Insufficient funds. Fund your wallet. ');
    }

    const escrowTransfer = await transferEscrowPayment(
      danaAirDetails.flightEscrow,
      danaAirDetails.airlineAddres,
      userDetails.addr,
      totalAmount.toString(),
      args.class,
      danaAirDetails.apstatus,
      ticker,
      userDetails.pvtKey
    )

    console.log("Transfer to escrow", escrowTransfer);

    const bookedflightDetails = {
      userId: userDetails.id,
      userFirstName: userDetails.firstname,
      userLastName: userDetails.lastname,
      email: userDetails.email,
      airlineName: danaAirDetails.airlineName,
      airlineAddres: danaAirDetails.airlineAddres,
      departureInfo: danaAirDetails.departureInfo,
      arrivalInfo: danaAirDetails.arrivalInfo,
      airlineId: danaAirDetails.airlineId,
      ticketId: ticker,
      flightEscrow: danaAirDetails.flightEscrow,
      amount: totalAmount.toString(),
      ...args,
    }

    const booked = await context.prisma.booked.create({
      data: { ...bookedflightDetails },
    });

    // update user table
    const flight = await context.prisma.booked.findMany({
      where: {
        userId: userDetails.id
      }
    });
    const user = await context.prisma.user.findUnique({
      where: {
        id: userDetails.id
      }
    })
    const usTotalFee = user.totalFee || 0;
    const balanceWallet = await balanceOf(userDetails.addr)
    await context.prisma.user.update({
      where: {
        id: userDetails.id
      },
      data: {
        walletBalance: balanceWallet.data,
        numOfFlights: Object.keys(flight).length,
        totalFee: totalAmount + usTotalFee,
      }
    })

    //update booked db
    const bookUpdate = await context.prisma.booked.update({
      where: {
        ticketId: ticker
      },
      data: {
        apstatus: '2',
        status: 'ONGOING',
        amount: totalAmount.toString()
      },
    });

    //update flight db
    // add the total number of passengers (eg adults, children and infants who booked flight)

    const passengerCount = bookUpdate.numOfAdults + bookUpdate.numOfChildren + bookUpdate.numOfInfants

    const flightQuery = await context.prisma.flight.findUnique({
      where: {
        flightCode: args.flightCode
      }
    })

    const fqPass = flightQuery.pass || 0;
    const fqTotalFee = flightQuery.totalFee || 0;

    const flightUpdate = await context.prisma.flight.update({
      where: {
        flightCode: args.flightCode
      },
      data: {
        pass: passengerCount + fqPass,
        totalFee: totalAmount + fqTotalFee,
        status: 'ONGOING'
      }
    })

    console.log("flightUpdate", flightUpdate);
    // create wallet transaction

    await context.prisma.wallettransactions.create({
      data: {
        userId: userDetails.id,
        from: userDetails.email,
        fromAddr: userDetails.addr,
        receiverName: danaAirDetails.airlineName,
        receiverAddr: danaAirDetails.airlineAddres,
        amount: totalAmount,
        description: `Booking paid to: ${danaAirDetails.airlineName}`,
        trxType: "Booking",
        status: "Completed"
      }
    });





    // percentage goes to airline wallet

    // const airlineDetails = await context.prisma.flight.findMany();
    // let result = airlineDetails.map(a => a.flightEscrow);  
    const { data: { flightEscrow } } = await airlineEscrow(danaAirDetails.airlineAddres);

    let flightesrwIndex = flightEscrow.indexOf(danaAirDetails.flightEscrow);


    const bookingClaimResult =
      await airlineClaimBookingFee(danaAirDetails.flightEscrow, flightesrwIndex, danaAirDetails.airlineAddres, danaAirDetails.airlinePswd);

    console.log("booking claim result", bookingClaimResult);

    await publishToQueue("bookedFlight", JSON.stringify(bookUpdate));

    await publishToQueue("updateFlight", JSON.stringify(flightUpdate));

    return {
      bookUpdate
    };

  }

  else if (airPeaceDetails !== undefined &&
    airPeaceDetails.flightCode === args.flightCode) {


    // check if user has enough balance
    const numOfChildren = args.numOfChildren || 0
    const numOfInfants = args.numOfInfants || 0

    const totalNumOfPassengers = args.numOfAdults + numOfChildren + numOfInfants;

    const totalAmount = totalNumOfPassengers * parseInt(args.amount)

    const userBalance = await balanceOf(userDetails.addr);

    if (parseInt(userBalance.data) < totalAmount) {
      throw new UserInputError('Insufficient funds. Fund your wallet. ');
    }

    const escrowTransfer = await transferEscrowPayment(
      airPeaceDetails.flightEscrow,
      airPeaceDetails.airlineAddres,
      userDetails.addr,
      totalAmount.toString(),
      args.class,
      airPeaceDetails.apstatus,
      ticker,
      userDetails.pvtKey
    )

    console.log("Transfer to escrow", escrowTransfer);

    const bookedflightDetails = {
      userId: userDetails.id,
      userFirstName: userDetails.firstname,
      userLastName: userDetails.lastname,
      email: userDetails.email,
      airlineName: airPeaceDetails.airlineName,
      airlineAddres: airPeaceDetails.airlineAddres,
      departureInfo: airPeaceDetails.departureInfo,
      arrivalInfo: airPeaceDetails.arrivalInfo,
      airlineId: airPeaceDetails.airlineId,
      ticketId: ticker,
      flightEscrow: airPeaceDetails.flightEscrow,
      amount: totalAmount.toString(),
      ...args,
    }

    const booked = await context.prisma.booked.create({
      data: { ...bookedflightDetails },
    });

    // update user table
    const flight = await context.prisma.booked.findMany({
      where: {
        userId: userDetails.id
      }
    });
    const user = await context.prisma.user.findUnique({
      where: {
        id: userDetails.id
      }
    })
    const usTotalFee = user.totalFee || 0;
    const balanceWallet = await balanceOf(userDetails.addr)
    await context.prisma.user.update({
      where: {
        id: userDetails.id
      },
      data: {
        walletBalance: balanceWallet.data,
        numOfFlights: Object.keys(flight).length,
        totalFee: totalAmount + usTotalFee,
      }
    })

    //update booked db
    const bookUpdate = await context.prisma.booked.update({
      where: {
        ticketId: ticker
      },
      data: {
        apstatus: '2',
        status: 'ONGOING',
        amount: totalAmount.toString()
      },
    });

    //update flight db
    // add the total number of passengers (eg adults, children and infants who booked flight)

    const passengerCount = bookUpdate.numOfAdults + bookUpdate.numOfChildren + bookUpdate.numOfInfants

    const flightQuery = await context.prisma.flight.findUnique({
      where: {
        flightCode: args.flightCode
      }
    })

    const fqPass = flightQuery.pass || 0;
    const fqTotalFee = flightQuery.totalFee || 0;

    const flightUpdate = await context.prisma.flight.update({
      where: {
        flightCode: args.flightCode
      },
      data: {
        pass: passengerCount + fqPass,
        totalFee: totalAmount + fqTotalFee,
        status: 'ONGOING'
      }
    })

    console.log("flightUpdate", flightUpdate);
    // create wallet transaction

    await context.prisma.wallettransactions.create({
      data: {
        userId: userDetails.id,
        from: userDetails.email,
        fromAddr: userDetails.addr,
        receiverName: airPeaceDetails.airlineName,
        receiverAddr: airPeaceDetails.airlineAddres,
        amount: totalAmount,
        description: `Booking paid to: ${airPeaceDetails.airlineName}`,
        trxType: "Booking",
        status: "Completed"
      }
    });





    // percentage goes to airline wallet

    // const airlineDetails = await context.prisma.flight.findMany();
    // let result = airlineDetails.map(a => a.flightEscrow);  
    const { data: { flightEscrow } } = await airlineEscrow(airPeaceDetails.airlineAddres);

    let flightesrwIndex = flightEscrow.indexOf(airPeaceDetails.flightEscrow);


    const bookingClaimResult =
      await airlineClaimBookingFee(airPeaceDetails.flightEscrow, flightesrwIndex, airPeaceDetails.airlineAddres, airPeaceDetails.airlinePswd);

    console.log("booking claim result", bookingClaimResult);

    await publishToQueue("bookedFlight", JSON.stringify(bookUpdate));

    await publishToQueue("updateFlight", JSON.stringify(flightUpdate));

    return {
      bookUpdate
    };

  }

  else if (arikAirDetails !== undefined &&
    arikAirDetails.flightCode === args.flightCode) {


    // check if user has enough balance
    const numOfChildren = args.numOfChildren || 0
    const numOfInfants = args.numOfInfants || 0

    const totalNumOfPassengers = args.numOfAdults + numOfChildren + numOfInfants;

    const totalAmount = totalNumOfPassengers * parseInt(args.amount)

    const userBalance = await balanceOf(userDetails.addr);

    if (parseInt(userBalance.data) < totalAmount) {
      throw new UserInputError('Insufficient funds. Fund your wallet. ');
    }

    const escrowTransfer = await transferEscrowPayment(
      arikAirDetails.flightEscrow,
      arikAirDetails.airlineAddres,
      pair.address,
      totalAmount.toString(),
      args.class,
      arikAirDetails.apstatus,
      ticker,
      pair.privateKey
    )

    console.log("Transfer to escrow", escrowTransfer);

    const bookedflightDetails = {
      userId: userDetails.id,
      userFirstName: userDetails.firstname,
      userLastName: userDetails.lastname,
      email: userDetails.email,
      airlineName: arikAirDetails.airlineName,
      airlineAddres: arikAirDetails.airlineAddres,
      departureInfo: arikAirDetails.departureInfo,
      arrivalInfo: arikAirDetails.arrivalInfo,
      airlineId: arikAirDetails.airlineId,
      ticketId: ticker,
      flightEscrow: arikAirDetails.flightEscrow,
      amount: totalAmount.toString(),
      ...args,
    }

    const booked = await context.prisma.booked.create({
      data: { ...bookedflightDetails },
    });

    // update user table
    const flight = await context.prisma.booked.findMany({
      where: {
        userId: userDetails.id
      }
    });
    const user = await context.prisma.user.findUnique({
      where: {
        id: userDetails.id
      }
    })
    const usTotalFee = user.totalFee || 0;
    const balanceWallet = await balanceOf(userDetails.addr)
    await context.prisma.user.update({
      where: {
        id: userDetails.id
      },
      data: {
        walletBalance: balanceWallet.data,
        numOfFlights: Object.keys(flight).length,
        totalFee: totalAmount + usTotalFee,
      }
    })

    //update booked db
    const bookUpdate = await context.prisma.booked.update({
      where: {
        ticketId: ticker
      },
      data: {
        apstatus: '2',
        status: 'ONGOING',
        amount: totalAmount.toString()
      },
    });

    //update flight db
    // add the total number of passengers (eg adults, children and infants who booked flight)

    const passengerCount = bookUpdate.numOfAdults + bookUpdate.numOfChildren + bookUpdate.numOfInfants

    const flightQuery = await context.prisma.flight.findUnique({
      where: {
        flightCode: args.flightCode
      }
    })

    const fqPass = flightQuery.pass || 0;
    const fqTotalFee = flightQuery.totalFee || 0;

    const flightUpdate = await context.prisma.flight.update({
      where: {
        flightCode: args.flightCode
      },
      data: {
        pass: passengerCount + fqPass,
        totalFee: totalAmount + fqTotalFee,
        status: 'ONGOING'
      }
    })

    console.log("flightUpdate", flightUpdate);
    // create wallet transaction

    await context.prisma.wallettransactions.create({
      data: {
        userId: userDetails.id,
        from: userDetails.email,
        fromAddr: userDetails.addr,
        receiverName: arikAirDetails.airlineName,
        receiverAddr: arikAirDetails.airlineAddres,
        amount: totalAmount,
        description: `Booking paid to: ${arikAirDetails.airlineName}`,
        trxType: "Booking",
        status: "Completed"
      }
    });





    // percentage goes to airline wallet

    // const airlineDetails = await context.prisma.flight.findMany();
    // let result = airlineDetails.map(a => a.flightEscrow);  
    const airline = await context.prisma.airline.findUnique({
      where: {
        id: arikAirDetails.airlineId
      }
    })

    console.log("airline found", airline)
    const pairAirline = await setAirlineKeypair(airline.email);
    console.log("keypair", pairAirline.address)
    console.log("keypairprivatekey", pairAirline.privateKey)
    const { data: { flightEscrow } } = await airlineEscrow(arikAirDetails.airlineAddres);

    let flightesrwIndex = flightEscrow.indexOf(arikAirDetails.flightEscrow);
    const bookingClaimResult =
      await airlineClaimBookingFee(arikAirDetails.flightEscrow, flightesrwIndex, pairAirline.address, pairAirline.privateKey);

    console.log("booking claim result", bookingClaimResult);

    await publishToQueue("bookedFlight", JSON.stringify(bookUpdate));

    await publishToQueue("updateFlight", JSON.stringify(flightUpdate));

    return {
      bookUpdate
    };
  }

  else {

    // if Air Peace
    if (arikAir) {

      const airline = await context.prisma.airline.findUnique({
        where: {
          id: arikAir.id
        }
      })

      console.log("airline found", airline)
      const pairAirline = await setAirlineKeypair(airline.email);
      console.log("keypair", pairAirline.address)
      const escrow = await escrowCreationPayment(pairAirline.address, pairAirline.privateKey,
        args.flightCode, args.departureDate, args.arrivalDate, args.departureTime);

      // add registered flight to db
      const flightDetails = {
        airlineId: arikAir.id,
        airlineName: arikAir.airlineName,
        airlineAddres: arikAir.addr,
        airfare: args.amount,
        flightCode: args.flightCode,
        departureCity: args.departureCity,
        departureDate: args.departureDate,
        departureTime: args.departureTime,
        arrivalCity: args.arrivalCity,
        arrivalDate: args.arrivalDate,
        arrivalTime: args.arrivalTime,
        flightEscrow: escrow.data.flightEscrow
      };

      const flightCreation = await context.prisma.flight.create({
        data: { ...flightDetails },
      });

      console.log("flight Created", flightCreation);

      // transport created flight to airline services
      const msgResult = await publishToQueue("registerFlightFromUser", JSON.stringify(flightCreation));



      // check if user has enough balance
      const numOfChildren = args.numOfChildren || 0
      const numOfInfants = args.numOfInfants || 0

      const totalNumOfPassengers = args.numOfAdults + numOfChildren + numOfInfants;

      const totalAmount = totalNumOfPassengers * parseInt(args.amount)

      const userBalance = await balanceOf(userDetails.addr);

      if (parseInt(userBalance.data) < totalAmount) {
        throw new UserInputError('Insufficient funds. Fund your wallet. ');
      }

      // Query db to find the newly created flight


      const flightFound = await context.prisma.flight.findMany({
        where: {
          airlineName: 'Arik Air',
          flightCode: args.flightCode
        }
      });

      let resultFlight = flightFound.map(a => a);
      const foundFlight = resultFlight.find(({ flightCode }) => flightCode === args.flightCode);

      const escrowTransfer = await transferEscrowPayment(
        foundFlight.flightEscrow,
        foundFlight.airlineAddres,
        pair.address,
        totalAmount.toString(),
        args.class,
        foundFlight.apstatus,
        ticker,
        pair.privateKey
      )

      console.log("Transfer to escrow", escrowTransfer);

      const bookedflightDetails = {
        userId: userDetails.id,
        userFirstName: userDetails.firstname,
        userLastName: userDetails.lastname,
        email: userDetails.email,
        airlineName: foundFlight.airlineName,
        airlineAddres: foundFlight.airlineAddres,
        departureInfo: foundFlight.departureInfo,
        arrivalInfo: foundFlight.arrivalInfo,
        airlineId: foundFlight.airlineId,
        ticketId: ticker,
        flightEscrow: foundFlight.flightEscrow,
        amount: totalAmount.toString(),
        ...args,
      }

      const booked = await context.prisma.booked.create({
        data: { ...bookedflightDetails },
      });

      // update user table
      const flight = await context.prisma.booked.findMany({
        where: {
          userId: userDetails.id
        }
      });
      const user = await context.prisma.user.findUnique({
        where: {
          id: userDetails.id
        }
      })
      const usTotalFee = user.totalFee || 0;
      const balanceWallet = await balanceOf(userDetails.addr)
      await context.prisma.user.update({
        where: {
          id: userDetails.id
        },
        data: {
          walletBalance: balanceWallet.data,
          numOfFlights: Object.keys(flight).length,
          totalFee: totalAmount + usTotalFee,
        }
      })

      //update booked db
      const bookUpdate = await context.prisma.booked.update({
        where: {
          ticketId: ticker
        },
        data: {
          apstatus: '2',
          status: 'ONGOING',
          amount: totalAmount.toString()
        },
      });

      //update flight db
      // add the total number of passengers (eg adults, children and infants who booked flight)

      const passengerCount = bookUpdate.numOfAdults + bookUpdate.numOfChildren + bookUpdate.numOfInfants

      const flightQuery = await context.prisma.flight.findUnique({
        where: {
          flightCode: args.flightCode
        }
      })

      const fqPass = flightQuery.pass || 0;
      const fqTotalFee = flightQuery.totalFee || 0;

      const flightUpdate = await context.prisma.flight.update({
        where: {
          flightCode: args.flightCode
        },
        data: {
          pass: passengerCount + fqPass,
          totalFee: totalAmount + fqTotalFee,
          status: 'ONGOING'
        }
      })

      console.log("flightUpdate", flightUpdate);
      // create wallet transaction

      await context.prisma.wallettransactions.create({
        data: {
          userId: userDetails.id,
          from: userDetails.email,
          fromAddr: userDetails.addr,
          receiverName: foundFlight.airlineName,
          receiverAddr: foundFlight.airlineAddres,
          amount: totalAmount,
          description: `Booking paid to: ${foundFlight.airlineName}`,
          trxType: "Booking",
          status: "Completed"
        }
      });





      // percentage goes to airline wallet

      // const airlineDetails = await context.prisma.flight.findMany();
      // let result = airlineDetails.map(a => a.flightEscrow);  

      console.log("keypair", pairAirline.address)
      console.log("keypairprivatekey", pairAirline.privateKey)
      const { data: { flightEscrow } } = await airlineEscrow(foundFlight.airlineAddres);

      let flightesrwIndex = flightEscrow.indexOf(foundFlight.flightEscrow);
      const bookingClaimResult =
        await airlineClaimBookingFee(foundFlight.flightEscrow, flightesrwIndex, pairAirline.address, pairAirline.privateKey);

      console.log("booking claim result", bookingClaimResult);

      await publishToQueue("bookedFlight", JSON.stringify(bookUpdate));

      await publishToQueue("updateFlight", JSON.stringify(flightUpdate));

      return {
        bookUpdate
      };


    }

    // if Dana Air
    if (danaAir) {
      const escrow = await escrowCreationPayment(danaAir.addr, danaAir.pvtKey,
        args.flightCode, args.departureDate, args.arrivalDate, args.departureTime);

      // add registered flight to db
      const flightDetails = {
        airlineId: danaAir.id,
        airlineName: danaAir.airlineName,
        airlineAddres: danaAir.addr,
        airlinePswd: danaAir.pvtKey,
        airfare: args.amount,
        flightCode: args.flightCode,
        departureCity: args.departureCity,
        departureDate: args.departureDate,
        departureTime: args.departureTime,
        arrivalCity: args.arrivalCity,
        arrivalDate: args.arrivalDate,
        arrivalTime: args.arrivalTime,
        flightEscrow: escrow.data.flightEscrow
      };

      const flightCreation = await context.prisma.flight.create({
        data: { ...flightDetails },
      });

      // transport created flight to airline services
      const msgResult = await publishToQueue("registerFlightFromUser", JSON.stringify(flightCreation));



      // check if user has enough balance
      const numOfChildren = args.numOfChildren || 0
      const numOfInfants = args.numOfInfants || 0

      const totalNumOfPassengers = args.numOfAdults + numOfChildren + numOfInfants;

      const totalAmount = totalNumOfPassengers * parseInt(args.amount)

      const userBalance = await balanceOf(userDetails.addr);

      if (parseInt(userBalance.data) < totalAmount) {
        throw new UserInputError('Insufficient funds. Fund your wallet. ');
      }

      // Query db to find the newly created flight


      const flightFound = await context.prisma.flight.findMany({
        where: {
          airlineName: 'Dana Air',
          flightCode: args.flightCode
        }
      });

      let resultFlight = flightFound.map(a => a);
      const foundFlight = resultFlight.find(({ flightCode }) => flightCode === args.flightCode);

      const escrowTransfer = await transferEscrowPayment(
        foundFlight.flightEscrow,
        foundFlight.airlineAddres,
        userDetails.addr,
        totalAmount.toString(),
        args.class,
        foundFlight.apstatus,
        ticker,
        userDetails.pvtKey
      )

      console.log("Transfer to escrow", escrowTransfer);

      const bookedflightDetails = {
        userId: userDetails.id,
        userFirstName: userDetails.firstname,
        userLastName: userDetails.lastname,
        email: userDetails.email,
        airlineName: foundFlight.airlineName,
        airlineAddres: foundFlight.airlineAddres,
        departureInfo: foundFlight.departureInfo,
        arrivalInfo: foundFlight.arrivalInfo,
        airlineId: foundFlight.airlineId,
        ticketId: ticker,
        flightEscrow: foundFlight.flightEscrow,
        amount: totalAmount.toString(),
        ...args,
      }

      const booked = await context.prisma.booked.create({
        data: { ...bookedflightDetails },
      });

      // update user table
      const flight = await context.prisma.booked.findMany({
        where: {
          userId: userDetails.id
        }
      });
      const user = await context.prisma.user.findUnique({
        where: {
          id: userDetails.id
        }
      })
      const usTotalFee = user.totalFee || 0;
      const balanceWallet = await balanceOf(userDetails.addr)
      await context.prisma.user.update({
        where: {
          id: userDetails.id
        },
        data: {
          walletBalance: balanceWallet.data,
          numOfFlights: Object.keys(flight).length,
          totalFee: totalAmount + usTotalFee,
        }
      })

      //update booked db
      const bookUpdate = await context.prisma.booked.update({
        where: {
          ticketId: ticker
        },
        data: {
          apstatus: '2',
          status: 'ONGOING',
          amount: totalAmount.toString()
        },
      });

      //update flight db
      // add the total number of passengers (eg adults, children and infants who booked flight)

      const passengerCount = bookUpdate.numOfAdults + bookUpdate.numOfChildren + bookUpdate.numOfInfants

      const flightQuery = await context.prisma.flight.findUnique({
        where: {
          flightCode: args.flightCode
        }
      })

      const fqPass = flightQuery.pass || 0;
      const fqTotalFee = flightQuery.totalFee || 0;

      const flightUpdate = await context.prisma.flight.update({
        where: {
          flightCode: args.flightCode
        },
        data: {
          pass: passengerCount + fqPass,
          totalFee: totalAmount + fqTotalFee,
          status: 'ONGOING'
        }
      })

      console.log("flightUpdate", flightUpdate);
      // create wallet transaction

      await context.prisma.wallettransactions.create({
        data: {
          userId: userDetails.id,
          from: userDetails.email,
          fromAddr: userDetails.addr,
          receiverName: foundFlight.airlineName,
          receiverAddr: foundFlight.airlineAddres,
          amount: totalAmount,
          description: `Booking paid to: ${foundFlight.airlineName}`,
          trxType: "Booking",
          status: "Completed"
        }
      });





      // percentage goes to airline wallet

      // const airlineDetails = await context.prisma.flight.findMany();
      // let result = airlineDetails.map(a => a.flightEscrow);  
      const { data: { flightEscrow } } = await airlineEscrow(foundFlight.airlineAddres);

      let flightesrwIndex = flightEscrow.indexOf(foundFlight.flightEscrow);


      const bookingClaimResult =
        await airlineClaimBookingFee(foundFlight.flightEscrow, flightesrwIndex, foundFlight.airlineAddres, foundFlight.airlinePswd);

      console.log("booking claim result", bookingClaimResult);

      await publishToQueue("bookedFlight", JSON.stringify(bookUpdate));

      await publishToQueue("updateFlight", JSON.stringify(flightUpdate));

      return {
        bookUpdate
      };


    }

    // if Air Peace
    if (airPeace) {
      const escrow = await escrowCreationPayment(airPeace.addr, airPeace.pvtKey,
        args.flightCode, args.departureDate, args.arrivalDate, args.departureTime);

      // add registered flight to db
      const flightDetails = {
        airlineId: airPeace.id,
        airlineName: airPeace.airlineName,
        airlineAddres: airPeace.addr,
        airlinePswd: airPeace.pvtKey,
        airfare: args.amount,
        flightCode: args.flightCode,
        departureCity: args.departureCity,
        departureDate: args.departureDate,
        departureTime: args.departureTime,
        arrivalCity: args.arrivalCity,
        arrivalDate: args.arrivalDate,
        arrivalTime: args.arrivalTime,
        flightEscrow: escrow.data.flightEscrow
      };

      console.log("flight details", flightDetails);

      const flightCreation = await context.prisma.flight.create({
        data: { ...flightDetails },
      });

      // transport created flight to airline services
      const msgResult = await publishToQueue("registerFlightFromUser", JSON.stringify(flightCreation));



      // check if user has enough balance
      const numOfChildren = args.numOfChildren || 0
      const numOfInfants = args.numOfInfants || 0

      const totalNumOfPassengers = args.numOfAdults + numOfChildren + numOfInfants;

      const totalAmount = totalNumOfPassengers * parseInt(args.amount)

      const userBalance = await balanceOf(userDetails.addr);

      if (parseInt(userBalance.data) < totalAmount) {
        throw new UserInputError('Insufficient funds. Fund your wallet. ');
      }

      // Query db to find the newly created flight


      const flightFound = await context.prisma.flight.findMany({
        where: {
          airlineName: 'Air Peace',
          flightCode: args.flightCode
        }
      });

      let resultFlight = flightFound.map(a => a);
      const foundFlight = resultFlight.find(({ flightCode }) => flightCode === args.flightCode);

      const escrowTransfer = await transferEscrowPayment(
        foundFlight.flightEscrow,
        foundFlight.airlineAddres,
        userDetails.addr,
        totalAmount.toString(),
        args.class,
        foundFlight.apstatus,
        ticker,
        userDetails.pvtKey
      )

      console.log("Transfer to escrow", escrowTransfer);

      const bookedflightDetails = {
        userId: userDetails.id,
        userFirstName: userDetails.firstname,
        userLastName: userDetails.lastname,
        email: userDetails.email,
        airlineName: foundFlight.airlineName,
        airlineAddres: foundFlight.airlineAddres,
        departureInfo: foundFlight.departureInfo,
        arrivalInfo: foundFlight.arrivalInfo,
        airlineId: foundFlight.airlineId,
        ticketId: ticker,
        flightEscrow: foundFlight.flightEscrow,
        amount: totalAmount.toString(),
        ...args,
      }

      const booked = await context.prisma.booked.create({
        data: { ...bookedflightDetails },
      });

      // update user table
      const flight = await context.prisma.booked.findMany({
        where: {
          userId: userDetails.id
        }
      });
      const user = await context.prisma.user.findUnique({
        where: {
          id: userDetails.id
        }
      })
      const usTotalFee = user.totalFee || 0;
      const balanceWallet = await balanceOf(userDetails.addr)
      await context.prisma.user.update({
        where: {
          id: userDetails.id
        },
        data: {
          walletBalance: balanceWallet.data,
          numOfFlights: Object.keys(flight).length,
          totalFee: totalAmount + usTotalFee,
        }
      })

      //update booked db
      const bookUpdate = await context.prisma.booked.update({
        where: {
          ticketId: ticker
        },
        data: {
          apstatus: '2',
          status: 'ONGOING',
          amount: totalAmount.toString()
        },
      });

      //update flight db
      // add the total number of passengers (eg adults, children and infants who booked flight)

      const passengerCount = bookUpdate.numOfAdults + bookUpdate.numOfChildren + bookUpdate.numOfInfants

      const flightQuery = await context.prisma.flight.findUnique({
        where: {
          flightCode: args.flightCode
        }
      })

      const fqPass = flightQuery.pass || 0;
      const fqTotalFee = flightQuery.totalFee || 0;

      const flightUpdate = await context.prisma.flight.update({
        where: {
          flightCode: args.flightCode
        },
        data: {
          pass: passengerCount + fqPass,
          totalFee: totalAmount + fqTotalFee,
          status: 'ONGOING'
        }
      })

      console.log("flightUpdate", flightUpdate);
      // create wallet transaction

      await context.prisma.wallettransactions.create({
        data: {
          userId: userDetails.id,
          from: userDetails.email,
          fromAddr: userDetails.addr,
          receiverName: foundFlight.airlineName,
          receiverAddr: foundFlight.airlineAddres,
          amount: totalAmount,
          description: `Booking paid to: ${foundFlight.airlineName}`,
          trxType: "Booking",
          status: "Completed"
        }
      });





      // percentage goes to airline wallet

      // const airlineDetails = await context.prisma.flight.findMany();
      // let result = airlineDetails.map(a => a.flightEscrow);  
      const { data: { flightEscrow } } = await airlineEscrow(foundFlight.airlineAddres);

      let flightesrwIndex = flightEscrow.indexOf(foundFlight.flightEscrow);


      const bookingClaimResult =
        await airlineClaimBookingFee(foundFlight.flightEscrow, flightesrwIndex, foundFlight.airlineAddres, foundFlight.airlinePswd);

      console.log("booking claim result", bookingClaimResult);

      await publishToQueue("bookedFlight", JSON.stringify(bookUpdate));

      await publishToQueue("updateFlight", JSON.stringify(flightUpdate));

      return {
        bookUpdate
      };


    }

  }


}




module.exports = {
  signup,
  login,
  sendEmailOTP,
  verifyMobileWithTermiiToken,
  sendTermiiTokenToMobile,
  makePayment,
  mint,
  bookFlight,
  userBankDetails,
  redeemFiat,
  transferToken,
  cancelBookings,
  checkIn,
  sendEmailVerification,
  verifyUser,
  resetPasswordRequest,
  resetPassword,
  getDepositQRCode,












  signupPayment,
  signupAnd2FAPayment,
  authPayment,
  verifyMobilePayment,
  verifyNewUserPayment,
  bookFlightPayment
  // verifyMobileWithTermiiTokenPayment,
  // makePaymentPayment,
  // balance  
  // transferToEscrow
};







 
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const { config } = require("dotenv");
config();


const amqp = require('amqplib/callback_api');
const CONN_URL = process.env.RABBITMQ_URL;


  amqp.connect(CONN_URL, function (err, conn) { 
    conn.createChannel(function (err, ch) {
        ch.consume('bookedFlightComplete', function (msg) {
                console.log('.. Flight worker ...');
                setTimeout(() => {
                    // console.log("Message:", JSON.parse(msg.content));
                    createFlight(msg.content);
                    ch.ack(msg);
                },4000);
            },{ noAck: false }
        );
    });
  })

 
const createFlight = async(flight) => {
  const data = JSON.parse(flight);

    for (let i = 0; i < data.length; i++) {

  const newFlight = await prisma.booked.updateMany({
      where: {
          flightCode: data[i].flightCode
      },
      data: {
        // pass: data[i].pass,
        // totalFee: data[i].totalFee,
        status: data[i].status,
        
      },
    });
  console.log("booked-flight-update", newFlight);
}
} 
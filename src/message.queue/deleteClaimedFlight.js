const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const { config } = require("dotenv");
config();


const amqp = require('amqplib/callback_api');
const CONN_URL = process.env.RABBITMQ_URL;


  amqp.connect(CONN_URL, function (err, conn) { 
    conn.createChannel(function (err, ch) {
        ch.consume('deleteClaimedFlight', function (msg) {
                console.log('.. Flight worker ...');
                setTimeout(() => {
                    // console.log("Message:", JSON.parse(msg.content));
                    deleteFlight(msg.content);
                    ch.ack(msg);
                },4000);
            },{ noAck: false }
        );
    });
  })

 
const deleteFlight = async(flight) => {
  const data = JSON.parse(flight);

    const deleteClaimedFlight = await prisma.flight.delete({
      where: {
        flightCode: data.flightCode
      }
    })
  console.log("flight-deleted", deleteClaimedFlight);

} 
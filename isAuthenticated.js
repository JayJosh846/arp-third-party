// const jwt = require("jsonwebtoken");

// export const isAuthenticated = async() => {

//     // check headers for authorization

// }
 // product
const amqp = require("amqp");

let channel, connection;

const connect = () => {
    const amqpServer = 'amqp://localhost:5672';
    connection = amqp.connect(amqpServer);
    channel = connection.createChannel();
    await channel.assertQueue("USER")

}

connect().then(() => {
    channel.consume("ORDER", data => {
        const {product, email } = JSON.parse(data.content)

         // use this to populate your db

        console.log("co9nsumeing order queue")
        channel.ack(data)
        channel.sendToQueue("PRODUCT", JSON.stringify({
            
        }))
    })
}) // run rabbitmq

// book airline: 

// create a booking with flights



/// order

channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({
    products,
    email
}))) // send from product to order
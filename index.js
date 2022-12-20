
const { PrismaClient } = require('@prisma/client')
const fs = require('fs');
const path = require('path');
const { getUserId } = require('./src/utils/auth');
// const Query = require('./resolvers/Query')
// const Mutation = require('./resolvers/Mutation')
// const { consumeFromQueue } = require("./message.queue/queue")
// const { flightWorker } = require('./message.queue/flightWorker');
// const { bookedFlightComplete } = require('./message.queue/bookedFlightComplete');
// const { deleteClaimedFlight } = require('./message.queue/deleteClaimedFlight'); 
// const { airlineCreation } = require('./message.queue/airlineCreation');
const { config } = require("dotenv");
config();
const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const {merge} = require('lodash')
const router = require('./routers')
const compression = require('compression');

// Swagger
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');




const prisma = new PrismaClient()

const app = express()
const PORT = process.env.PORT;

const CORS_CONFIG = {
  origin: true,
  exposedHeaders: ["Content-Range", "X-Content-Range"], 
};

// app.options("*", cors());
// app.use(cors(CORS_CONFIG));
// app.set("trust proxy", 1);


app.use(cors({
  origin: "*"

}))


app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.disable("view cache");




app.options("*", cors());
app.use(cors(CORS_CONFIG));
app.set("trust proxy", 1);


app.use("/api/v1", router);


/* Catches all invalid routes and displays the 404 page */
//app.get("**", (_, res) => res.redirect("/"));
// app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🟢 Server started on port ${PORT}`);

  /* Used to test server build */
  if (process.env.NODE_ENV === "build") {
    console.log("🧪 Testing server build"); 
    setTimeout(() => {
      console.log("✅ Build test passed");
      process.exit(0);
    }, 5000);
  }
});


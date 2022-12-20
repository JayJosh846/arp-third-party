const { config } = require("dotenv");
config();
const nodemailer = require('nodemailer');
const nodemailerMailgun = require('nodemailer-mailgun-transport');
var hbs = require('nodemailer-express-handlebars');
const { google } = require("googleapis");



const API_ROUTE =
process.env.NODE_ENV === "development"
  ? 'http://localhost:4003'
  : "https://aeropaye-user.herokuapp.com";

// const SITE_ROOT =
// process.env.NODE_ENV === "development"
// ? "http://localhost:3000"
// : "https://dashboard.aeropaye.com";

// const API_ROUTE = "https://aeropaye-web3.herokuapp.com"
const SITE_ROOT = "https://dashboard.aeropaye.com"
// const SITE_ROOT = "http://localhost:3000"


// google email client
const oAuth2Client = new google.auth.OAuth2(
  process.env.AUTH_CLIENT_ID,
  process.env.AUTH_CLIENT_SECRET,
  process.env.AUTH_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.AUTH_REFRESH_TOKEN,
});

const accessToken = oAuth2Client.getAccessToken();

// oauth approach
let transporterPro = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAUTH2",
    user: process.env.AUTH_EMAIL,
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    refreshToken: process.env.AUTH_REFRESH_TOKEN,
    accessToken: accessToken,
  },
});


//mailgun email client
// const auth = {
//     auth: {
//         // add envs to DB
//       api_key: process.env.MAILGUN_SECRET_KEY,
//       domain: process.env.MAILGUN_DOMAIN,
//     },
//   };

//   let transporterPro = nodemailer.createTransport(
//     nodemailerMailgun(auth)
//   );

  if (transporterPro) {
    transporterPro.use(
      "compile",
      hbs({
        viewEngine: {
          extname: ".handlebars",
          layoutsDir: "emailsAPI/views/layouts/",
          partialsDir: "emailsAPI/views/layouts/",
          defaultLayout: "main.handlebars",
        },
        // viewEngine: "express-handlebars",
        viewPath: "emailsAPI/views/",
        extName: ".handlebars",
        cache: false, 
      })
    );
    transporterPro.verify((error, success) => {
      if (!success) {
        console.log(error, error.message, "Mail setup");
      } else {
        console.log("Mail ready to send", success);
      }
    });
  }

  const mailer = transporterPro 

  module.exports =
  {
    mailer,
    API_ROUTE,
    SITE_ROOT
  } ;
//   module.exports = ;

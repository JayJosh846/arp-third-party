const bcrypt = require("bcryptjs");
const { uuid } = require('uuidv4');
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const {mailer, API_ROUTE, SITE_ROOT} = require('./emailConfig');
// const  = require('../config/emailConfig')


const sendConfirmationEmail = async (user) => {   

     //* TEMPLATE SET
  const uniqueString = uuid() + user.id;

  //* Hash unique string before saving to db for later testing
  const hashedUniqueString = await bcrypt.hash(uniqueString, 10);

  // check if verification exists
  const verificationExists = await prisma.userverification.findUnique({
      where: {
          userId: user.id
      }
    });

    console.log('user verification', verificationExists);

    if (verificationExists) {
        await prisma.userverification.delete({
              where: {
                userId: user.id
            }
            })
          .then(() => console.log("Deleted obsolete verifications"))
          .catch((err) =>
            console.log(err, "Error while deleting obsolete verification")
          );
      }

      //create new userVerification in db

      const newVerification = {
        userId: user.id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 21600000
      }
      
      await prisma.userverification.create({data: { ...newVerification}});




      const url = `${SITE_ROOT + '/user/verify/' + user.id + '/' + uniqueString}`


      return await mailer.sendMail ({
        // from: 'jesudara.j@gmail.com',
        to: user.email, 
        isHtml: false,
        template: "register",
        context: 
        {
          link: `${url}`,
        }, 
        layout: false,
        subject: "Confirmation Email",
        
        // html: `Confirmation email <a href=${url}> ${url}</a> `
    }) 
    .then(() => console.log("Email sent."))
    .catch((err) =>
      console.log(err, "Email was not sent.")
    );
}


const sendPasswordResetEmail = async (user) => {

    //* TEMPLATE SET
 const resetString = uuid() + user.id;

 //* Hash unique string before saving to db for later testing
 const hashedResetString = await bcrypt.hash(resetString, 10);

 // check if data exists
 const resetPassExists = await prisma.passwordreset.findUnique({
     where: {
         userId: user.id
     }
   });

   console.log('user pass request', resetPassExists);

   if (resetPassExists) {
       await prisma.passwordreset.delete({
             where: {
               userId: user.id
           }
           })
         .then(() => console.log("Deleted obsolete reset string"))
         .catch((err) =>
           console.log(err, "Error while deleting obsolete reset string")
         );
     }

     //create new pass request in db

     const newPassReq = {
       userId: user.id,
       resetString: hashedResetString,
       createdAt: Date.now(),
       expiresAt: Date.now() + 21600000
     }
     
     await prisma.passwordreset.create({data: { ...newPassReq}});

     const url = `${SITE_ROOT}/reset-password?id=${user.id}&resetstring=${resetString}`
    //  &id=${user.id}&resetstring=${resetString}`

     return await mailer.sendMail ({
        // from: 'jesudara.j@gmail.com',
        to: user.email, 
        isHtml: false,
        template: "passwordReset",
        context: 
        {
          link: `${url}`,
        }, 
        layout: false,
        subject: "Password Reset",
        
        // html: `Confirmation email <a href=${url}> ${url}</a> `
    }) 
   .then(() => console.log("Reset password email sent."))
   .catch((err) =>
     console.log(err, "Email was not sent.")
   );
}


 const sendItinerary = async (
  //*TEMPLATE SET
  userFirstName,
  userLastName,
  airlineName,
  email,
  flightCode,
  departureCity,
  departureDate,
  departureTime,
  arrivalCity,
  arrivalDate,
  arrivalTime,
  flightClass,
  ticketId,
  status
) => {

  // const url = `${SITE_ROOT}/?view=reset&step=2&id=${user.id}&resetstring=${resetString}`

  return mailer.sendMail ({
    from: 'jesudara.j@gmail.com',
    to: email, 
    isHtml: false,
    template: "itinerary",
    context: 
    {
      userFirstName,
      userLastName,
      airlineName,
      flightCode,
      departureCity,
      departureDate,
      departureTime,
      arrivalCity,
      arrivalDate,
      arrivalTime,
      flightClass,
      ticketId,
      status
      // link: `${url}`,
    }, 
    layout: false,
    subject: `Your Flight Itinerary with  ${airlineName}`,
    
    // html: `Confirmation email <a href=${url}> ${url}</a> `
})
};

module.exports = {
    sendConfirmationEmail,
    sendPasswordResetEmail,
    sendItinerary
}



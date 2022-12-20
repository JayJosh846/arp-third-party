const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient();

module.exports = { 
    
    getDanaAirFlights: async(args, context) => { 

        const flight = await context.prisma.flight.findMany({
            where: {
                airlineName: 'Dana Air',
                flightCode: args.flightCode
    
            }
        });


        for (let i = 0; i < flight.length; i++) {   
            
            if (flight.length !== 0) {

        return flight[i];
        }
      }
    },

    getAirPeaceFlights: async(args, context) => {

        const flight = await context.prisma.flight.findMany({
            where: {
                airlineName: 'Air Peace',
                flightCode: args.flightCode
    
            }
        });
    

            for (let i = 0; i < flight.length; i++) {
                if (flight.length !== 0) {
    
            return flight[i];
            }
          }
    },

    getArikAirFlights: async(args, context) => {

        const flight = await context.prisma.flight.findMany({
            where: {
                airlineName: 'Arik Air',
                flightCode: args.flightCode
    
            }
        });
    

            for (let i = 0; i < flight.length; i++) {  
            if (flight.length !== 0) {
  
            return flight[i];
            }
          }

}
//   module.exports = {
//     getDanaAirFlights
  }


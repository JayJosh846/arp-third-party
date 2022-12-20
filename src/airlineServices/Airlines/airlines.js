const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient();

module.exports = { 
    
    getDanaAir: async(args, context) => { 

        const flight = await context.prisma.airline.findUnique({
            where: {
                airlineName: 'Dana Air',    
            }
        });
        return flight
    },

    getAirPeace: async(args, context) => { 

        const flight = await context.prisma.airline.findUnique({
            where: {
                airlineName: 'Air Peace',    
            }
        });
        return flight

    },

    getArikAir: async(args, context) => { 

        const flight = await context.prisma.airline.findUnique({
            where: {
                airlineName: 'Arik Air',    
            } 
        });
        return flight

    }
}
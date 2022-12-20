const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
    validateId: async(args, context) => {
        return Number(args.id) === context?.userId;
    },

    getAUserById: async (context) => {
        const user = context.prisma.user.findUnique({
          where: { id: context.userId },
        });
        // console.log('user', user); 
        return user;
    },

    getAFlightById: async (context) => {
        const flight = context.prisma.flight.findUnique({
          where: { id: context.userId },
        });
        // console.log('flight', flight); 
        return flight;
    },

    isEmailOrMobileExist: async(args, context) => {
        return await context.prisma.user.findUnique({
            where: {
                emailMobile: {
                  email: args.email,
                  mobile: args.mobile,
                },
              }
          });
    }
}


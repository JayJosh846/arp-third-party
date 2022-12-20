const bcrypt = require("bcryptjs");
const { uuid } = require('uuidv4');
const { ACCESS_TOKEN_EXTERNAL_SECRET } = require('../middleware/authorizeToken')

const generateApiKey = uuid();


const checkoutLink = async (req, res, next) => {
    return res.status(200).json({
        status: "success",
        message: "https://aeropaye.com",
    });
};

const createExternalAPIKey = async (req, res, next) => {
    try {
      const hashedApiKey = await generateAPI(ACCESS_TOKEN_EXTERNAL_SECRET);
      console.log("API KEY", hashedApiKey);
      res.json({
        staus: "success",
        message: "Created successfully",
        data: hashedApiKey,
      });
    } catch (err) {
      next(err);
    }
  };
  
  const generateAPI = async (value) => {
    return await bcrypt.hash(value, 10);

  };


module.exports = {
    checkoutLink,
    createExternalAPIKey
}


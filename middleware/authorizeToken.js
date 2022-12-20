const { compareSync } = require("bcryptjs");
const { config } = require("dotenv");
config();

const ACCESS_TOKEN_EXTERNAL_SECRET =
  process.env.ACCESS_TOKEN_EXTERNAL_SECRET || "";


const externalTokenAuth =  async (req, res, next) => {
  const apiKey = req.headers["api-key"] || req.headers["API-KEY"];

  if (apiKey == null || typeof apiKey == undefined) return res.sendStatus(401);

  // Verify token after confirming validity

  if (compareSync(ACCESS_TOKEN_EXTERNAL_SECRET, apiKey)) {
    next();
  } else {
    return res.sendStatus(401);
  }
};

module.exports = { 
  ACCESS_TOKEN_EXTERNAL_SECRET,
  externalTokenAuth
}

const jwt = require('jsonwebtoken');
const { config } = require('dotenv')
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXP = process.env.JWT_EXP;

const getTokenPayload = (token) => {
  return jwt.verify(token, JWT_SECRET);
}

const getUserId = (req, authToken) => {
  if (req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        throw new Error('No token found');
      }
      const { userId } = getTokenPayload(token);
      return userId;
    }
  } else if (authToken) {
    const { userId } = getTokenPayload(authToken);
    return userId;
  }

  throw new Error('Not authenticated');
}

module.exports = {
  JWT_SECRET,
  JWT_EXP,
  getUserId
};

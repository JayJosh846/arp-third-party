const Axios = require("axios");
const request = require("request");
const { config } = require("dotenv");

config();
const BASE_URL = process.env.TERMII_BASE_URL
const API_KEY = process.env.TERMII_API_KEY


// response sample
// token {
//   pinId: '4b0e9726-e24c-4101-b354-bf8cdca46384',
//   to: '2347030099566',
//   smsStatus: 'Message Sent',
//   status: 200
// }

exports.sendOTP = async (mobile) => {
  const data = {
    api_key: API_KEY,
    message_type: "NUMERIC",
    to: mobile,
    from: "N-Alert",
    channel: "dnd",
    pin_attempts: 3,
    pin_time_to_live: 5,
    pin_length: 6,
    pin_placeholder: "< 1234 >",
    message_text: "Your Aeropaye confirmation code is < 1234 >. Valid for 5 minutes, one-time use only",
    pin_type: "NUMERIC",
  };
  let termiiResult;

  await Axios.request({
    url: '/sms/otp/send',
    method: 'post',
    baseURL: BASE_URL,
    data: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      'cache-control': 'no-cache'
    }
  })
    .then((result) => {
      termiiResult = result.data
    })
    .catch((error) => {
      console.log("termii-send-token-err =>", error);
    });
  console.log('termiiResult', termiiResult);
  return termiiResult;
};



exports.verifyOTP = async (pinId, pin) => {
  var data = {
    api_key: API_KEY,
    pin_id: pinId,
    pin,
  };  

  let termiiResult;

  await Axios.request({
    url: '/sms/otp/verify',
    method: 'post',
    baseURL: BASE_URL,
    data: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      'cache-control': 'no-cache'
    }
  })
    .then((result) => {
      termiiResult = result.data
    })
    .catch((error) => {
      termiiResult = error.response.data;
      console.log("***termii-verify-token", error.message);
    });
  return termiiResult;
};
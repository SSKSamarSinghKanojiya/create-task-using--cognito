require('dotenv').config();

const serverless = require("serverless-http");
const app = require("./app");

module.exports.handler = async (event, context) => {
  try {
    return await serverless(app)(event, context);
  } catch (error) {
    console.error("Error in Lambda handler:", error);
    throw new Error('Error processing request');
  }
};


// require('dotenv').config();

// const serverless = require("serverless-http")
// const app = require("./app")

// module.exports.handler = serverless(app)
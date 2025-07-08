require("dotenv").config();
const jwt = require('jsonwebtoken');  // JWT library to decode and verify the token
const jwksClient = require('jwks-rsa');  // Library to get public keys for RS256 verification

// Create a JWKS client to retrieve Cognito public keys
const client = jwksClient({
  jwksUri: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`  // Replace with your actual Cognito User Pool ID
});

// Function to get the public key for a given JWT header
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    }
  });
};

// Function to verify the token and check if the user belongs to a specific group
const verifyTokenAndGroup = async (token, groupName) => {
  try {
    // Decode the JWT header to extract the 'kid' (key ID)
    const decodedHeader = jwt.decode(token, { complete: true }).header;

    // Get the key for the token from Cognito's JWKS
    const key = await new Promise((resolve, reject) => {
      getKey(decodedHeader, (err, signingKey) => {
        if (err) reject(err);
        else resolve(signingKey);
      });
    });

    // Verify the token using the retrieved public key and the RS256 algorithm
    const decoded = jwt.verify(token, key, { algorithms: ['RS256'] });

    // Check if the user's groups are available in the decoded token
    const userGroups = decoded["cognito:groups"];  // The claim that holds the groups the user is in

    // If userGroups exists and includes the desired group, return decoded data
    if (!userGroups || !userGroups.includes(groupName)) {
      throw new Error(`User is not part of the ${groupName} group`);
    }

    // Return the decoded token (you can access user details here)
    return decoded;

  } catch (error) {
    console.error("Token validation failed:", error);  // Log the error
    throw new Error("Token validation failed: " + error.message);  // Propagate the error
  }
};

module.exports = { verifyTokenAndGroup };


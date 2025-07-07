const jwt = require('jsonwebtoken');  // Import the jsonwebtoken library for decoding JWT tokens

/**
 * Decodes and verifies a JWT token.
 * @param {string} token - The JWT token to decode and verify.
 * @param {string} requiredGroup - The required group that the user must belong to (e.g., 'Admins').
 * @returns {object} - The decoded JWT token if the user belongs to the required group.
 * @throws {Error} - Throws error if the user is not in the required group.
 */
const verifyTokenAndGroup = (token, requiredGroup) => {
  try {
    // Decode the JWT token without verifying its signature (you should verify the token signature in production)
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      throw new Error('Invalid token');
    }

    // Extract user groups from the decoded JWT token
    const userGroups = decoded.payload['cognito:groups'];  // Cognito groups are stored in 'cognito:groups' claim
    console.log(userGroups);
    
    // Check if the user is in the required group
    if (!userGroups || !userGroups.includes(requiredGroup)) {
      throw new Error(`Access Denied: User is not in the ${requiredGroup} group`);
    }

    return decoded.payload;  // Return the decoded JWT token (user data)
  } catch (error) {
    console.error('Error decoding token:', error);
    throw new Error('Unauthorized: ' + error.message);
  }
};

module.exports = {
  verifyTokenAndGroup,
};

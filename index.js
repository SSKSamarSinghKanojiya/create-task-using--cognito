// src/controllers/groupController.js
const groupService = require('../services/groupService');  // Import the service to get groups
const { verifyTokenAndGroup } = require('../utils/jwtHelper');  // Import the JWT helper function

// Controller function to handle the GET request for listing groups
exports.listGroups = async (req, res) => {
  // Get the JWT token from the Authorization header
  const token = req.headers.authorization?.split(' ')[1];  // Extract the JWT token (bearer token)

  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  try {
    // Verify the token and check if the user belongs to the 'Admins' group
    const decoded = verifyTokenAndGroup(token, 'Admins');  // 'Admins' is the required group

    // If the user is authorized, fetch the groups from Cognito
    const groups = await groupService.listAllGroups();
    
    return res.status(200).json({
      message: 'Groups fetched successfully',
      groups: groups,  // Return the list of groups
    });

  } catch (error) {
    console.error('Error during token validation:', error);
    return res.status(403).json({
      message: 'Access Denied',
      error: error.message,  // Error message will include reasons like "User is not in the required group"
    });
  }
};

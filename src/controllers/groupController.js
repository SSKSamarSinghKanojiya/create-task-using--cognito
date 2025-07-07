const groupService = require("../services/groupService");
const { verifyTokenAndGroup } = require("../utils/jwtHelper");

exports.createUserPool = async (req, res) => {
  const { poolName } = JSON.parse(req.body);  // Expecting poolName in the body of the request

  if (!poolName) {
    return res.status(400).json({ message: "User pool name is required" });
  }

  try {
    const result = await groupService.createUserPool(poolName);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create user pool',
      error: error.message,
    });
  }
};


exports.createGroup = async (req, res) => {
  // const { groupName, description } = req.body;  // Directly access request body
  const { groupName, description } = JSON.parse(req.body);

  // Check if group name is provided
  if (!groupName) {
    return res.status(400).json({ message: "Group name is required" });
  }

  const sanitizedGroupName = groupName.replace(/\s+/g, "_"); // Replace spaces with underscores

  try {
    // Call the service to create the group in DynamoDB and Cognito
    const result = await groupService.createGroup(
      sanitizedGroupName,
      description
    );

    return res.status(201).json({
      message: "Group created successfully!",
      group: result.dynamoDbItem,
      cognitoGroup: result.cognitoGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error); // Logging for debugging
    return res.status(500).json({
      message: "Failed to create group",
      error: error.message,
    });
  }
};

exports.createUserAndAddToGroup = async (req, res) => {
  const { email, username, groupName } = JSON.parse(req.body);

  if (!email || !username || !groupName) {
    return res
      .status(400)
      .json({ message: "Email, username, and group name are required" });
  }
  const sanitizedGroupName = groupName.replace(/\s+/g, "_"); // Replace spaces with underscores
  try {
    const result = await groupService.createUserAndAddToGroup(
      email,
      username,
      sanitizedGroupName
    );
    return res.status(201).json({
      message: result.message,
      user: result.user,
      group: result.group,
    });
  } catch (error) {
    console.log("Error creating user and adding to group: ", error);
    return res.status(500).json({
      message: "Failed to create user and add to group",
      error: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = JSON.parse(req.body);
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  try {
    const result = await groupService.forgotPassword(email);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to initiate password reset",
      error: error.message,
    });
  }
};

exports.confirmForgotPassword = async (req, res) => {
  const { email, verificationCode, newPassword } = JSON.parse(req.body);
  if (!email || !verificationCode || !newPassword) {
    return res
      .status(400)
      .json({
        message: "Email, verfication code, and new password are required",
      });
  }
  try {
    const result = await groupService.confirmForgotPassword(
      email,
      verificationCode,
      newPassword
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to confirm password reset",
      error: error.message,
    });
  }
};



// Controller for signing up a user
exports.signUpUser = async (req, res) => {
  const { email, username, password } = JSON.parse(req.body); // Expecting email, username, and password

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Email, username, and password are required" });
  }

  try {
    const result = await groupService.signUpUser(email, username, password);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to sign up user',
      error: error.message,
    });
  }
};


// Controller for confirming the user's email
exports.confirmUser = async (req, res) => {
  const { username } = JSON.parse(req.body); // Expecting username to confirm

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const result = await groupService.confirmUser(username);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to confirm user',
      error: error.message,
    });
  }
};


// Controller for adding the user to a group
exports.addUserToGroup = async (req, res) => {
  const { username, groupName } = req.body; // Expecting username and groupName

  if (!username || !groupName) {
    return res.status(400).json({ message: "Username and group name are required" });
  }

  try {
    const result = await groupService.addUserToGroup(username, groupName);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to add user to group',
      error: error.message,
    });
  }
};

// Controller for confirming the password reset
exports.confirmPassword = async (req, res) => {
  const { email, verificationCode, newPassword } = req.body; // Expecting email, verification code, and new password

  if (!email || !verificationCode || !newPassword) {
    return res.status(400).json({ message: "Email, verification code, and new password are required" });
  }

  try {
    const result = await groupService.confirmPassword(email, verificationCode, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to confirm password reset',
      error: error.message,
    });
  }
}


exports.removeUserFromGroup = async(req,res)=>{
  const { username, groupName } = JSON.parse(req.body);
  if (!username || !groupName) {
    return res.status(400).json({ message: "Username and group name are required" });
  }
  const sanitizedGroupName = groupName.replace(/\s+/g, "_"); 
  
  try {
    const result = await groupService.removeUserFromGroup(username, sanitizedGroupName);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to remove user from group',
      error: error.message,
    });
  }
}

exports.loginUser = async (req, res) => {
  const { username, password } = JSON.parse(req.body);  // Get username and password from the request body

  // Validate request body
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Call the login service function
    const result = await groupService.loginUser (username, password);
    return res.status(200).json(result);  // Send successful response with JWT tokens
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to authenticate user',
      error: error.message,
    });
  }
};


// Controller for listing all groups
// exports.listGroups = async (req, res) => {
//   try {
//     const result = await groupService.listGroups();
//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(500).json({
//       message: 'Failed to list groups',
//       error: error.message,
//     });
//   }
// };


// // Controller function to handle the request to list all groups
exports.listGroups = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({message:"Authorization token missing"})
  }
  try {
    const decoded = verifyTokenAndGroup(token,'Admins')
    // Call the service to get all groups
    const groups = await groupService.listAllGroups();
    
    // Return the groups in the response
    return res.status(200).json({
      message: 'Groups fetched successfully',
      groups: groups,  // Send the list of groups
    });
  } catch (error) {
    // If there's an error, return an error response
     console.error('Error during token validation:', error);
    return res.status(500).json({
      message: 'Access Denied',
      error: error.message,
    });
  }
};



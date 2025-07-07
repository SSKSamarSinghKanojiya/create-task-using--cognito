require("dotenv").config();
const AWS = require("aws-sdk");
const {
  CognitoIdentityProviderClient,
  CreateGroupCommand,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminConfirmSignUpCommand,
  AdminSetUserPasswordCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  CreateUserPoolCommand,
  AdminInitiateAuthCommand,
  ListGroupsCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const cognitoClient = new CognitoIdentityProviderClient({
  region: "us-east-1",
});
const crypto = require('crypto');
// const GROUP_TABLE = process.env.DYNAMODB_TABLE_NAME;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET
console.log("COGNITO_USER_POOL_ID:", process.env.COGNITO_USER_POOL_ID);
console.log("DYNAMODB_TABLE_NAME:", process.env.DYNAMODB_TABLE_NAME);
console.log("COGNITO_CLIENT_ID: ", process.env.COGNITO_CLIENT_ID);
console.log("COGNITO_CLIENT_SECRET",process.env.COGNITO_CLIENT_SECRET);
// Function to compute the SECRET_HASH
// const calculateSecretHash = (username) => {
//   const message = CLIENT_ID + username;
//   const hmac = crypto.createHmac('sha256', CLIENT_SECRET);
//   hmac.update(message);
//   return hmac.digest('base64');
// };

const calculateSecretHash = (username) => {
  return crypto.createHmac("SHA256",CLIENT_SECRET).update(username + CLIENT_ID).digest("base64")
};


// Function to create a Cognito User Pool
exports.createUserPool = async (poolName) => {
  try {
    // Define the User Pool configuration
    const params = {
      PoolName: poolName,  // Name for the User Pool
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: true,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: true
        }
      },
      LambdaConfig: {},  // Optional, if you want to use Lambda triggers
      AutoVerifiedAttributes: ["email"], // Automatically verify the email address
      MfaConfiguration: "OFF", // MFA configuration, can be "ON" or "OFF"
      SmsAuthenticationMessage: "Your verification code is {####}.", // Optional message for SMS
      EmailVerificationMessage: "Your verification code is {####}.", // Email message
      VerificationMessageTemplate: {
        DefaultEmailOption: "CONFIRM_WITH_LINK", // Can be "CONFIRM_WITH_LINK" or "CONFIRM_WITH_CODE"
      }
    };

    const createUserPoolCommand = new CreateUserPoolCommand(params);
    const response = await cognitoClient.send(createUserPoolCommand);

    console.log("User Pool Created:", response);
    return {
      message: "User pool created successfully.",
      poolId: response.UserPool.Id,
    };
  } catch (error) {
    console.error("Error creating user pool:", error);
    return {
      message: "Error creating user pool.",
      error: error.message,
    };
  }
};



exports.createGroup = async (groupName, description) => {
  const groupId = AWS.util.uuid.v4(); // Generate a UUID for the group

  const params = {
    // TableName: GROUP_TABLE,
    TableName: "Groups",
    Item: {
      groupId: groupId,
      groupName: groupName,
      description: description || "Default description",
    },
  };

  try {
    // Store the group data in DynamoDB
    await dynamoDb.put(params).promise();

    // Create a new group in Cognito
    const cognitoParams = {
      GroupName: groupName,
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Description: description || "Default description",
    };

    const createGroupCommand = new CreateGroupCommand(cognitoParams);
    const result = await cognitoClient.send(createGroupCommand);
    return {
      dynamoDbItem: params.Item,
      cognitoGroup: result,
    };
  } catch (error) {
    throw new Error("Error saving group: " + error.message);
  }
};

// const GROUP_NAME=  "Samar_Group"

exports.createUserAndAddToGroup = async (email, username, groupName) => {
  try {
    const createUserParams = {
      UserPoolId: USER_POOL_ID,
      Username: username,
      TemporaryPassword: "TemporaryPassword123!",
      MessageAction: "SUPPRESS",
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
      ],
    };
    const createUSerCommand = new AdminCreateUserCommand(createUserParams);
    const createUserResponse = await cognitoClient.send(createUSerCommand);
    console.log("User created: ", createUserResponse);

    // Step 2: Set a permanent password and confirm user
    const setPasswordParams = {
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: "TemporaryPassword123!", // same or new password
      Permanent: true, // mark password as permanent and user as confirmed
    };
    const setPasswordCommand = new AdminSetUserPasswordCommand(setPasswordParams);
    const setPasswordResponse = await cognitoClient.send(setPasswordCommand);
    console.log("Password set & user confirmed: ", setPasswordResponse);

    // Add user to the specified group
    const addUserToGroupParams = {
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: groupName,
    };
    const addUserToGroupCommand = new AdminAddUserToGroupCommand(
      addUserToGroupParams
    );
    const addUserToGroupResponse = await cognitoClient.send(
      addUserToGroupCommand
    );
    console.log("User added to group : ", addUserToGroupResponse);

    return {
      message: "User created and added to group successfully",
      user: createUserResponse,
      passwordSet: setPasswordResponse,
      group: addUserToGroupResponse,
    };
  } catch (error) {
    console.error("Error creating user and adding to group:", error);
    throw new Error(
      "Error creating user and adding to group: " + error.message
    );
  }
};

exports.forgotPassword = async (email) => {
  try {
    const secretHash = calculateSecretHash(email); // Generate the SECRET_HASH using the email
    const command = new ForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email,
      SecretHash: secretHash,
    });
    const response = await cognitoClient.send(command);
    console.log("Password reset initiated:", response);
    return {
      message: "Password reset instruction sent to the user.",
      response: response,
    };
  } catch (error) {
    console.error("Error initiating password reset: ", error);
    return {
      message: "Error initiating password reset.",
      error: error.message,
    };
  }
};

exports.confirmForgotPassword = async (
  email,
  verificationCode,
  newPassword
) => {
  try {
    const secretHash = calculateSecretHash(email);
    const command = new ConfirmForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: verificationCode,
      Password: newPassword,
      SecretHash: secretHash,
    });
    const response = await cognitoClient.send(command);
    console.log("Password reset confirmed:", response);
    return {
      message: "Password reset successfully",
      response: response,
    };
  } catch (error) {
    console.error("Error confirming password reset:", error);
    return {
      message: "Error confirming password reset.",
      error: error.message,
    };
  }
};

// Sign up a user in Cognito
exports.signUpUser = async (email, username, password) => {
  try {
    // Sign up the user in Cognito
    const createUserParams = {
      UserPoolId: USER_POOL_ID,
      Username: username,
      TemporaryPassword: password,  // Set a temporary password
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
      ],
    };

    const createUserCommand = new AdminCreateUserCommand(createUserParams);
    const createUserResponse = await cognitoClient.send(createUserCommand);
    console.log("User created:", createUserResponse);

    // Set a new password to change the status from FORCE_CHANGE_PASSWORD to CONFIRMED
    const setPasswordParams = {
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: "NewSecurePassword123!", // The password you want to set
      Permanent: true, // Marks the password as permanent
    };

    const setPasswordCommand = new AdminSetUserPasswordCommand(setPasswordParams);
    const setPasswordResponse = await cognitoClient.send(setPasswordCommand);
    console.log("Password set:", setPasswordResponse);

    return {
      message: "User signed up and password set successfully.",
      user: createUserResponse,
      passwordSet: setPasswordResponse,
    };
  } catch (error) {
    console.error("Error signing up user:", error);
    return {
      message: "Error signing up user.",
      error: error.message,
    };
  }
};


// Confirm the user sign-up
exports.confirmUser = async (username) => {
  try {
    const confirmUserParams = {
      UserPoolId: USER_POOL_ID,
      Username: username,
    };

    const confirmUserCommand = new AdminConfirmSignUpCommand(confirmUserParams);
    const confirmUserResponse = await cognitoClient.send(confirmUserCommand);
    console.log("User confirmed:", confirmUserResponse);

    return {
      message: "User confirmed successfully.",
      response: confirmUserResponse,
    };
  } catch (error) {
    console.error("Error confirming user:", error);
    return {
      message: "Error confirming user.",
      error: error.message,
    };
  }
};

// Add the user to a group
exports.addUserToGroup = async (username, groupName) => {
  try {
    const addUserToGroupParams = {
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: groupName,  // Group name to add the user to
    };

    const addUserToGroupCommand = new AdminAddUserToGroupCommand(addUserToGroupParams);
    const addUserToGroupResponse = await cognitoClient.send(addUserToGroupCommand);
    console.log("User added to group:", addUserToGroupResponse);

    return {
      message: "User added to group successfully.",
      response: addUserToGroupResponse,
    };
  } catch (error) {
    console.error("Error adding user to group:", error);
    return {
      message: "Error adding user to group.",
      error: error.message,
    };
  }
};

// Confirm the user's password reset
exports.confirmPassword = async (email, verificationCode, newPassword) => {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: CLIENT_ID,      // The client ID of your Cognito App Client
      Username: email,          // The email (username) of the user
      ConfirmationCode: verificationCode, // The code sent to the user's email
      Password: newPassword,    // The new password the user wants to set
    });

    const response = await cognitoClient.send(command);
    console.log("Password reset confirmed:", response);
    return {
      message: "Password reset successfully.",
      response: response,
    };
  } catch (error) {
    console.error("Error confirming password reset:", error);
    return {
      message: "Error confirming password reset.",
      error: error.message,
    };
  }
};



exports.removeUserFromGroup = async (username, groupName) => {
  try {
   // Step 1: List groups for user
    const listGroupsCommand = new AdminListGroupsForUserCommand({
      Username: username,
      UserPoolId: USER_POOL_ID,
    });

    const listGroupsResponse = await cognitoClient.send(listGroupsCommand);
    const groups = listGroupsResponse.Groups || [];

    const isInGroup = groups.some(group => group.GroupName === groupName);

    if (!isInGroup) {
      return {
        message: `User ${username} is already not in group '${groupName}'`,
        alreadyRemoved: true,
      };
    }


    const params = {
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: groupName,
    };

    const command = new AdminRemoveUserFromGroupCommand(params);
    const response = await cognitoClient.send(command);

    console.log(`User ${username} removed from group ${groupName}`);
    return {
      message: "User removed from group successfully",
      response,
    };
  } catch (error) {
    console.error("Error removing user from group:", error);
    return {
      message: "Failed to remove user from group",
      error: error.message,
    };
  }
};

exports.loginUser = async (username, password) => {
  try {
    const authParams = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH', // Use this flow for username and password authentication
      ClientId: CLIENT_ID,
      UserPoolId: USER_POOL_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    // If Client Secret is configured, add it to the parameters
    if (CLIENT_SECRET) {
      authParams.ClientSecret = CLIENT_SECRET;
    }

    // Create a command to initiate authentication
    const command = new AdminInitiateAuthCommand(authParams);
    const response = await cognitoClient.send(command);

    return {
      message: 'Authentication successful',
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw new Error('Error authenticating user: ' + error.message);
  }
};

// Function to list all groups in the user pool
// exports.listGroups = async () => {
//   try {
//     const params = {
//       UserPoolId: USER_POOL_ID, // The user pool ID you want to list groups for
//       // Optional: You can specify pagination parameters
//       // Limit: 60,  // To limit the number of groups in one response (default is 60)
//     };

//     const command = new ListGroupsCommand(params);
//     const response = await cognitoClient.send(command);
//     console.log("Groups retrieved:", response);

//     return {
//       message: "Groups retrieved successfully.",
//       groups: response.Groups,
//     };
//   } catch (error) {
//     console.error("Error listing groups:", error);
//     return {
//       message: "Error listing groups.",
//       error: error.message,
//     };
//   }
// };


// This service function fetches all groups from the user pool
exports.listAllGroups = async () => {
  const params = {
    UserPoolId: USER_POOL_ID,  // The User Pool ID
  };

  try {
    // Create the ListGroupsCommand to fetch all groups
    const command = new ListGroupsCommand(params);
    const response = await cognitoClient.send(command);  // Execute the command
    
    // Return the list of groups
    return response.Groups;  // Array of group objects
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw new Error('Error fetching groups: ' + error.message);  // Propagate the error
  }
};
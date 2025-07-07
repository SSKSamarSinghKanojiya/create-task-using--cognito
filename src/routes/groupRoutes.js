const express = require("express");
const { createGroup, createUserAndAddToGroup, forgotPassword, confirmForgotPassword, signUpUser, confirmUser, addUserToGroup, confirmPassword, removeUserFromGroup, createUserPool, loginUser, listGroups } = require("../controllers/groupController");
const router = express.Router();



// Route to create a user pool
router.post("/create-user-pool", createUserPool);

// Define the POST route for creating a group
router.post("/groups", createGroup);

router.post("/create-user", createUserAndAddToGroup);

// Route to initiate forgot password flow
router.post("/forgot-password", forgotPassword);

// Route to confirm the new password after verification code is provided
router.post("/confirm-forgot-password", confirmForgotPassword);

// Route for signing up a user
router.post("/sign-up", signUpUser);

// Route for confirming a user after sign-up
router.post("/confirm-user", confirmUser);

// Route for adding a user to a group
router.post("/add-user-to-group", addUserToGroup);

// Route to confirm the password reset
router.post("/confirm-password", confirmPassword);
module.exports = router;

// Route to remove a user from a group
router.post("/remove-from-group", removeUserFromGroup);

// Define the POST route for login
router.post('/login', loginUser);  // POST /login for user authentication

// Route for listing all groups
router.get("/list-groups", listGroups);



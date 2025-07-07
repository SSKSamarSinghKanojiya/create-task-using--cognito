const groupService = require('../services/groupService');

// Controller for initiating the forgot password process
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;  // Expecting email in the body of the request

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const result = await groupService.forgotPassword(email);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to initiate password reset',
      error: error.message,
    });
  }
};

// Controller for confirming the password reset after the user provides the verification code
exports.confirmForgotPassword = async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  if (!email || !verificationCode || !newPassword) {
    return res.status(400).json({ message: "Email, verification code, and new password are required" });
  }

  try {
    const result = await groupService.confirmForgotPassword(email, verificationCode, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to confirm password reset',
      error: error.message,
    });
  }
};

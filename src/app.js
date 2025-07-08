require('dotenv').config();

const express = require("express");
const groupRoutes = require("./routes/groupRoutes");

const app = express();

// Middleware to parse JSON body
app.use(express.json());

// Routes setup
app.use("/", groupRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Port setup
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;


// require('dotenv').config();

// const express = require("express");
// const groupRoutes = require("./routes/groupRoutes");

// const app = express();

// // Middleware to parse JSON body
// app.use(express.json());

// // Routes setup
// app.use("/api", groupRoutes);

// module.exports = app;

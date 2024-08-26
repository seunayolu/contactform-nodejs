const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const processForm = require('./process');

// Load environment variables
dotenv.config();

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle form submissions
app.post('/submit-form', processForm);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

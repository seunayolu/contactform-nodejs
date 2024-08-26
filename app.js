const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const submitForm = require('./routes/submitForm');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS as the template engine
app.set('view engine', 'ejs');

// Serve the form page
app.get('/', (req, res) => {
    res.render('index');
});

// Route to handle form submission
app.post('/submit', submitForm);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
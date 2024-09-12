// server.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { upload, processForm } = require('./process');

// Load environment variables
dotenv.config();

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle form submissions
app.post('/submit-form', upload.single('attachment'), processForm);

// Serve the index.html file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

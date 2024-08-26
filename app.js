const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
const contactRoute = require('./routes/contact');
app.use('/contact', contactRoute);

app.get('/', (req, res) => {
    res.redirect('/contact');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

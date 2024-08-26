const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.get('/', (req, res) => {
    res.render('index');
});

router.post('/submit', contactController.submitForm);

module.exports = router;

const express = require('express');
const router = express.Router();

const { getAllMenuOptions } = require('./menus.controller');

router.get('/', getAllMenuOptions);

module.exports = router;


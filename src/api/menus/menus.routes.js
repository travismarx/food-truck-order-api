const express = require('express');
const router = express.Router();

const { getAllMenuOptions } = require('./menus.controller');

router.get('/', getAllMenuOptions);
// router.get('/items', getAllSessions);
// router.post('/types', startNewSession);

// router.get('/options', getNewSessionOptions);

// router.get('/:status', getSessionsByStatus);



module.exports = router;


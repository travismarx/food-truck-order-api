const express = require('express');
const router = express.Router();

const { getAllSessions, getSessionsByStatus, startNewSession, joinSession, getNewSessionOptions, getSessionData, getSessionReport, endSession, searchSessions } = require('./sessions.controller');

router.get('/', getAllSessions);
router.post('/', startNewSession);

router.get('/options', getNewSessionOptions);
router.get('/search', searchSessions);
router.get('/report/:sessionId', getSessionReport);

router.get('/:sessionId', getSessionData);
router.get('/status/:status', getSessionsByStatus);
router.put('/:sessionId/complete', endSession);



module.exports = router;


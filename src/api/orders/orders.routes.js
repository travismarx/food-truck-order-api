const express = require('express');
const router = express.Router();

const { getAllOrders, submitOrder, getSessionOrdersByStatus, updateOrderStatus } = require('./orders.controller');

router.get('/', getAllOrders);
router.post('/', submitOrder);
router.get('/session/:sessionId', getSessionOrdersByStatus);
router.put('/:orderId', updateOrderStatus);

module.exports = router;


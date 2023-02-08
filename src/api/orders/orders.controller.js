const { saveOrderInfoQuery, saveOrderItemsQuery, getSessionOrdersByStatusQuery, getSessionOrderItemsByStatusQuery, updateOrderStatusQuery, getOrdersByStatusCountQuery } = require('./orders.repository');
const { updateSessionUpdatedTime } = require('../sessions/sessions.repository');

const { io } = require('../../server');

const getAllOrders = (req, res) => {
    res.send('Getting all orders');
};

const submitOrder = async (req, res) => {
    try {
        const order = req.body;
        const timestamp = Math.round(Date.now() / 1000);
        const status = order.items.filter(item => item.quantity).length === 1 && order.items.filter(item => item.quantity)[0].stub === 'DRINK' ? 'ready' : 'open';

        const newOrderId = (await saveOrderInfoQuery({ ...order, timestamp, status }))[0].orderId;
        const newOrderItems = order.items.filter(item => item.quantity > 0).map(item => {
            return {
                orderId: newOrderId,
                quantity: item.quantity,
                price: item.price,
                menuItemId: item.menuItemId,
                totalCost: item.totalCost,
            }
        });
        await saveOrderItemsQuery(newOrderItems);
        await updateSessionUpdatedTime(order.sessionId);

        io.to(order.sessionId).emit('new-order', { orderId: newOrderId, items: newOrderItems });

        res.send({ message: 'Order Submitted' });
    } catch (error) {
        console.log('ERROR: ', error);
        throw new Error('Error Occurred: ', error);
    }
};

const getSessionOrdersByStatus = async (req, res) => {
    try {

        const { sessionId } = req.params;
        const { status, offset, limit, orderBy, sortDir } = req.query;
        let sessionOrders = [];
        let avgTime;

        const orders = await getSessionOrdersByStatusQuery(sessionId, status, orderBy, sortDir, offset, limit);
        const orderCount = +(await getOrdersByStatusCountQuery(sessionId, status))[0].count;
        const orderItems = await getSessionOrderItemsByStatusQuery(sessionId, status, orderBy, sortDir, offset, limit);


        // if (status === 'ready') {
        //     console.log('ORDERS: ', orders);
        // }
        // console.log('ORDER ITEMS: ', orderItems);

        if (orders && orders.length) {
            if (status === 'ready') {
                const nonDrinkOrders = orders.filter(order => order.updatedTimestamp > order.createdTimestamp);
                avgTime = Math.round(nonDrinkOrders.reduce((acc, current) => {
                    return acc + +(Math.round(current.updatedTimestamp - current.createdTimestamp) / 60)
                }, 0) / nonDrinkOrders.length);
            }
            sessionOrders = orders.map(order => {
                return {
                    ...order,
                    items: orderItems.filter(item => item.orderId === order.orderId)
                }
            });
        }

        res.send({ count: orderCount, avgTime, orders: sessionOrders });
    }
    catch (error) {
        console.log('ERROR: ', error);
        throw new Error('Error Occurred: ', error);
    }
}

const updateOrderStatus = async (req, res) => {
    try {

        const { orderId } = req.params;
        const { status, sessionId } = req.body;
        const nowTimestamp = Math.floor(Date.now() / 1000);

        await updateOrderStatusQuery(status, nowTimestamp, orderId);
        await updateSessionUpdatedTime(sessionId);

        io.to(sessionId).emit('order-ready');

        res.send({ ok: true });
    } catch (error) {
        console.log('ERROR: ', error);
        throw new Error('Error Occurred: ', error);
    }
}

module.exports = { getAllOrders, submitOrder, getSessionOrdersByStatus, updateOrderStatus };
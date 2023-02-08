const { getSessionsByStatusQuery, endSessionQuery } = require('./sessions.repository');
const { getSessionOrdersByStatusQuery, closeAllOpenSessionOrders } = require('../orders/orders.repository');

const getAvgEarningsPerHour = (sessionInfo) => {
    const nowTimestamp = Math.round(Date.now() / 1000);
    const sessionHours = sessionInfo.finishedTimestamp
        ? +(((sessionInfo.finishedTimestamp - sessionInfo.createdTimestamp) / 3600).toFixed(2))
        : +(((nowTimestamp - sessionInfo.createdTimestamp) / 3600).toFixed(2));

    return +((sessionInfo.totalEarnings / sessionHours).toFixed(2))
}

const closeForgottenSessions = async () => {
    const nowTimestamp = Math.round(Date.now() / 1000);
    const twoHoursInSeconds = 7200;
    const openSessions = await getSessionsByStatusQuery('open');
    const sessionsToClose = openSessions.filter(session => {
        return nowTimestamp - session.updatedTimestamp > twoHoursInSeconds
    });

    for (let { sessionId, updatedTimestamp } of sessionsToClose) {
        await closeAllOpenSessionOrders(sessionId);
        await endSessionQuery(sessionId, updatedTimestamp);
    }
}


module.exports = { getAvgEarningsPerHour, closeForgottenSessions };
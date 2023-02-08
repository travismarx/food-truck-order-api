const {
    getNewSessionOptionsQuery,
    getSessionsByStatusQuery,
    createNewSessionQuery,
    getSessionDataQuery,
    getSessionReportQuery,
    getSessionOrderItemsQuery,
    getSessionOrdersCountQuery,
    getSessionQuickNotesQuery,
    getSessionDiscountOptionsQuery,
    endSessionQuery,
    searchSessionsByDateQuery
} = require("./sessions.repository");
const {
    createNewMenuType,
    insertNewMenu,
    getSessionMenuQuery,
} = require("../menus/menus.repository");
const { getAvgEarningsPerHour } = require("./sessions.service");
const moment = require('moment-timezone');

const getAllSessions = (req, res) => {
    res.send("Getting all sessions");
};

const getSessionsByStatus = async (req, res) => {
    const status = req.params.status;
    try {
        const result = await getSessionsByStatusQuery(status);
        res.send(result);
    } catch (error) {
        console.log("ERROR GETTING SESSIONS BY STATUS: ", error);
    }
};

const startNewSession = async (req, res) => {
    try {
        const { sessionTypeId, sessionTitle, menu } = req.body;
        let menuTypeId = menu.menuTypeId;
        let menuItems = menu.items
            .filter((item) => item.enabled)
            .map((item) => {
                return {
                    menuTypeId: item.menuTypeId,
                    menuItemId: item.menuItemId,
                    price: item.price,
                };
            });

        // Using a new menu
        if (!menu.menuTypeId) {
            const menuTitle =
                menu.newMenuTitle && menu.newMenuTitle.length ? menu.newMenuTitle : sessionTitle;
            menuTypeId = (await createNewMenuType(menuTitle, menu.saveNewMenu))[0].menuTypeId;
            const menuItems = menu.items
                .filter((item) => item.enabled)
                .map((item) => {
                    return {
                        menuTypeId,
                        menuItemId: item.menuItemId,
                        price: item.price,
                    };
                });
            await insertNewMenu(menuItems);
        }

        const newSessionId = (await createNewSessionQuery(sessionTypeId, sessionTitle, menuTypeId))[0].sessionId;

        res.status(200).send({ sessionId: newSessionId });
    } catch (e) {
        console.log("ERROR CREATING SESSION: ", e);
        res.status(500);
    }
};

const joinSession = (req, res) => {
    res.send("Joining session");
};

const getNewSessionOptions = async (req, res) => {
    try {
        const result = await getNewSessionOptionsQuery();
        res.send(result);
    } catch (error) {
        console.log("ERROR GETTING SESSION OPTIONS: ", e);
        throw new Error('Error Occurred: ', error);
    }
};

const getSessionData = async (req, res) => {
    const { sessionId } = req.params;
    try {
        const sessionInfo = (await getSessionDataQuery(sessionId))[0];
        sessionInfo.startTime = moment(sessionInfo.createdDate).tz('America/Los_Angeles').format('h:mm a');
        const endTime = sessionInfo.finishedTimestamp || Date.now();
        sessionInfo.endTime = moment(endTime).tz('America/Los_Angeles').format('h:mm a');
        const sessionMenu = await getSessionMenuQuery(sessionInfo.menuTypeId);
        const notesOptions = await getSessionQuickNotesQuery();
        const discountOptions = await getSessionDiscountOptionsQuery();

        res.send({ sessionInfo: { ...sessionInfo, notesOptions, discountOptions }, sessionMenu });
    } catch (error) {
        console.log("ERROR GETTING SESSION DATA: ", error);
        throw new Error('Error Occurred: ', error);
    }
};

const getSessionReport = async (req, res) => {
    try {

        const { sessionId } = req.params;

        const sessionInfo = (await getSessionReportQuery(sessionId))[0];
        sessionInfo.startTime = moment(sessionInfo.createdDate).tz('America/Los_Angeles').format('h:mm a');
        const endTime = sessionInfo.finishedTimestamp || Math.round(Date.now() / 1000);
        const newDate = new Date(0);
        newDate.setUTCSeconds(endTime);
        sessionInfo.endTime = moment(newDate).tz('America/Los_Angeles').format('h:mm a');
        const totalOrders = (await getSessionOrdersCountQuery(sessionId))[0];
        const unfilteredSessionOrderItems = await getSessionOrderItemsQuery(sessionId);
        const sessionOrderItems = {};
        for (let item of unfilteredSessionOrderItems) {
            if (!sessionOrderItems[item.stub]) {
                sessionOrderItems[item.stub] = { sold: 0, earned: 0, stub: item.stub, colorCode: item.colorCode, menuItemId: item.menuItemId }
            }
            sessionOrderItems[item.stub].sold += item.quantity;
            sessionOrderItems[item.stub].earned += item.totalCost;
        }
        const menuItemTotals = Object.values(sessionOrderItems).sort((a, b) => a.menuItemId - b.menuItemId)

        const allSessionInfo = {
            ...sessionInfo,
            avgEarningsPerHour: +getAvgEarningsPerHour(sessionInfo),
            totalOrders: +totalOrders.count,
            totalItems: unfilteredSessionOrderItems.length,
        }

        res.send({ sessionInfo: allSessionInfo, menuItemTotals });
    } catch (error) {
        console.log('ERROR: ', error);
        throw new Error('Error Occurred: ', error);
    }
}

const endSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        await endSessionQuery(sessionId);

        res.send({ ok: true });
    } catch (error) {
        console.log('ERROR: ', error);
        throw new Error('Error Occurred: ', error);
    }
}

const searchSessions = async (req, res) => {
    try {
        let { date, text } = req.query;
        text = text.replace(/[\W_]+/g, "");
        const results = await searchSessionsByDateQuery(date, text);

        res.send(results);
    } catch (error) {
        console.log('ERROR SEARCHING SESSIONS: ', error);
        throw new Error('Error Occurred: ', error);
    }
}

module.exports = {
    getAllSessions,
    getSessionsByStatus,
    startNewSession,
    joinSession,
    getNewSessionOptions,
    getSessionData,
    getSessionReport,
    endSession,
    searchSessions
};

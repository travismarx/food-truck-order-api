const pgClient = require('../../config/postgres');

const getLimitValue = (val) => {
    if (val === 'null') {
        return null;
    } else {
        return val;
    }
}

const saveOrderInfoQuery = async (order) => {
    const { sessionId, customerName, buzzerNumber, notes, totalCost, paid, change, discountId, timestamp, status } = order;
    const query = {
        text: `
        INSERT INTO orders(session_id, customer_name, buzzer_number, notes, total_cost, paid, change_due, status, discount_id, created_timestamp, updated_timestamp) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
        RETURNING order_id as "orderId"
        `,
        values: [sessionId, customerName, buzzerNumber, notes, totalCost, paid, change, status, discountId, timestamp]
    }

    return (await pgClient.query(query)).rows;
}

const saveOrderItemsQuery = async (items) => {
    const preparedArray = [];
    for (let k = 0; k < Object.keys(items[0]).length; k++) {
        preparedArray[k] = [];
        for (let i = 0; i < items.length; i++) {
            preparedArray[k].push(Object.values(items[i])[k])
        }
    }
    const query = {
        text: `
        INSERT INTO order_items(order_id, quantity, item_price, menu_item_id, total_cost) 
        SELECT * FROM UNNEST ($1::int[], $2::int[], $3::int[], $4::int[], $5::int[])
        `,
        values: [...preparedArray]
    };

    return (await pgClient.query(query));
}

const getSessionOrderItemsByStatusQuery = async (sessionId, status, orderBy, sortDir, offset, limit) => {
    const query = {
        text: `
        SELECT
            oi.quantity,
            oi.order_id as "orderId",
            mi.stub,
            mi.color_code as "colorCode",
            mi.ignore_in_order as "ignore"
        FROM order_items oi
        LEFT JOIN orders o on oi.order_id = o.order_id
        LEFT JOIN menu_items mi on oi.menu_item_id = mi.menu_item_id
        WHERE o.session_id = ${sessionId}
        AND o.status = '${status}'
        `,
        // text: `
        // SELECT
        //     oi.quantity,
        //     oi.order_id as "orderId",
        //     mi.stub,
        //     mi.color_code as "colorCode",
        //     mi.ignore_in_order as "ignore"
        // FROM order_items oi
        // LEFT JOIN orders o on oi.order_id = o.order_id
        // LEFT JOIN menu_items mi on oi.menu_item_id = mi.menu_item_id
        // WHERE o.session_id = $1
        // AND o.status = $2
        // ORDER BY $3 ${sortDir}
        // OFFSET $4
        // LIMIT $5
        // `,
        // values: [sessionId, status, orderBy, offset, getLimitValue(limit)]
    };

    return (await pgClient.query(query)).rows;
}

const getSessionOrdersByStatusQuery = async (sessionId, status, orderBy, sortDir, offset, limit) => {
    const query = {
        text: `
        SELECT
            o.customer_name as "customerName",
            o.buzzer_number as "buzzerNumber",
            o.order_id as "orderId",
            o.notes,
            o.created_timestamp::INTEGER as "createdTimestamp",
            o.updated_timestamp::INTEGER as "updatedTimestamp",
            (SELECT TO_TIMESTAMP(o.created_timestamp)) as "startTime",
            (SELECT TO_TIMESTAMP(o.updated_timestamp)) as "readyTime"
        FROM orders o
        WHERE
            o.session_id = ${sessionId}
        AND
            o.status = '${status}'
        ORDER BY ${orderBy} ${sortDir}
        OFFSET ${offset}
        LIMIT ${getLimitValue(limit)}
        `,
        // text: `
        // SELECT
        //     o.customer_name as "customerName",
        //     o.buzzer_number as "buzzerNumber",
        //     o.order_id as "orderId",
        //     o.notes,
        //     o.created_timestamp::INTEGER as "createdTimestamp",
        //     o.updated_timestamp::INTEGER as "updatedTimestamp"
        // FROM orders o
        // WHERE
        //     o.session_id = $1
        // AND
        //     o.status = $2
        // ORDER BY $3 ${sortDir}
        // OFFSET $4
        // LIMIT $5
        // `,
        // values: [sessionId, status, orderBy, offset, getLimitValue(limit)]
    };

    return (await pgClient.query(query)).rows;
}

const getOrdersByStatusCountQuery = async (sessionId, status) => {
    const query = {
        text: `
        SELECT COUNT(*)
    FROM orders o
    WHERE
        o.session_id = ${sessionId}
    AND
        o.status = '${status}'
        `
    }
    return (await pgClient.query(query)).rows;
}

const updateOrderStatusQuery = async (status, nowTimestamp, orderId) => {
    // Set finished timestamp same as updated since we only use 'open' and 'ready' status
    const query = {
        text: `
        UPDATE orders
        SET status = $1, updated_timestamp = $2, finished_timestamp = $2
        WHERE order_id = $3
        `,
        values: [status, nowTimestamp, orderId]
    };

    return (await pgClient.query(query));
}

const closeAllOpenSessionOrders = async (sessionId) => {
    const nowTimestamp = Math.round(Date.now() / 1000);
    const query = {
        text: `
        UPDATE orders
        SET status = 'ready', updated_timestamp = $1, finished_timestamp = $1, notes = 'CLOSED BY SERVER'
        WHERE session_id = $2
        AND status = 'open'
        `,
        values: [nowTimestamp, sessionId]
    }

    return (await pgClient.query(query));
}

module.exports = {
    saveOrderInfoQuery,
    saveOrderItemsQuery,
    getSessionOrderItemsByStatusQuery,
    getSessionOrdersByStatusQuery,
    getOrdersByStatusCountQuery,
    updateOrderStatusQuery,
    closeAllOpenSessionOrders
};
const pgClient = require('../../config/postgres');
const { sessionReportQuery, sessionOrderItemsQuery, sessionOrdersCountQuery, updateSessionActivityTime } = require('./sessions.queries');

const getNewSessionOptionsQuery = async () => {
    const query = {
        text: `
        SELECT
            session_type_id as "sessionTypeId",
            title
        FROM session_types`
    };

    return (await pgClient.query(query)).rows;

    const result = await pgClient.query(query).catch(error => {
        console.log('ERROR GETTING SESSIONS: ', error);
    });
}

const getSessionsByStatusQuery = async (status) => {
    const query = {
        text: `
        SELECT
            session_id as "sessionId",
            title,
            status,
            updated_timestamp::integer as "updatedTimestamp"
        FROM
            sessions s
        WHERE
            status = $1
        ORDER BY
            session_id DESC
        `,
        values: [status]
    };

    return (await pgClient.query(query)).rows;
}

const createNewSessionQuery = async (sessionTypeId, title, menuTypeId) => {
    const nowTimestamp = Math.round(Date.now() / 1000);
    const query = {
        text: `
        INSERT INTO sessions (title, session_type_id, status, menu_type_id, created_timestamp, updated_timestamp)
        VALUES ($1, $2, $3, $4, $5, $5)
        RETURNING session_id as "sessionId"
        `,
        values: [title, sessionTypeId, 'open', menuTypeId, nowTimestamp]
    }
    return await (await pgClient.query(query)).rows;
}

const getSessionDataQuery = async (sessionId) => {
    const query = {
        text: `
        SELECT 
            s.session_id as "sessionId",
            s.title,
            s.status,
            s.session_type_id as "sessionTypeId",
            s.menu_type_id as "menuTypeId",
            s.created_dt as "createdDate",
            s.created_timestamp as "createdTimestamp",
            s.finished_timestamp as "finishedTimestamp",
            st.title as "sessionTypeTitle",
            st.session_type_id as "sessionTypeId"
        FROM sessions s
        LEFT JOIN session_types st ON s.session_type_id = st.session_type_id
        WHERE s.session_id = $1;
        `,
        values: [sessionId]
    };

    return await (await pgClient.query(query)).rows;

}

const getSessionQuickNotesQuery = async () => {
    const query = {
        text: `
            SELECT
                note_options_id as "noteOptionId",
                text as "label"
            FROM notes_options
        `
    };

    return await (await pgClient.query(query)).rows;
}

const getSessionDiscountOptionsQuery = async () => {
    const query = {
        text: `
            SELECT
                discount_id as "discountId",
                CONCAT(label, ' (', percent_off, '%)') AS "label",
                percent_off as "percentOff"
            FROM discount_options
        `
    };
    return await (await pgClient.query(query)).rows;
}

const getSessionReportQuery = async (sessionId) => {
    const query = { text: sessionReportQuery, values: [sessionId] };
    return await (await pgClient.query(query)).rows;
}

const getSessionOrderItemsQuery = async (sessionId) => {
    const query = { text: sessionOrderItemsQuery, values: [sessionId] };
    return await (await pgClient.query(query)).rows;
}

const getSessionOrdersCountQuery = async (sessionId) => {
    const query = { text: sessionOrdersCountQuery, values: [sessionId] };
    return await (await pgClient.query(query)).rows;
}

const endSessionQuery = async (sessionId, timestamp) => {
    const endingTimestamp = timestamp || Math.round(Date.now() / 1000);

    const query = {
        text: `
        UPDATE sessions
        SET status = $1, finished_timestamp = $2
        WHERE session_id = $3
        `,
        values: ['complete', endingTimestamp, sessionId]
    }
    return await (await pgClient.query(query))
}

const searchSessionsByDateQuery = async (date, text) => {
    // console.log('TEXT: ', text);
    let day, month, year, string, createdDtFormattedString;
    if (date) {
        day = new Date(date).getDate();
        month = new Date(date).getMonth() + 1;
        year = new Date(date).getFullYear();
        string = `${month}/${day}/${year}`;
        if (day.toString().length === 1) {
            day = `0${day}`
        }
        if (month.toString().length === 1) {
            month = `0${month}`
        }
        createdDtFormattedString = `${year}-${month}-${day}`;
    }
    const query = {
        text: `
        SELECT
            session_id as "sessionId",
            status,
            title,
            created_dt as "createdDate"
        FROM sessions
        WHERE
            title LIKE '%${string}%'
        OR
            regexp_replace(title, '[^[:alnum:]]', '', 'g') ILIKE '%${text}%'
        OR
            to_char(created_dt AT TIME ZONE 'PST', 'YYYY-MM-DD') LIKE '%${createdDtFormattedString}%'
        OR
            translate(title, '-/@', '') ILIKE '%${text}%'
        ORDER BY created_dt DESC
        `,
    }
    return await (await pgClient.query(query)).rows;
}

const updateSessionUpdatedTime = async (sessionId) => {
    const nowTimestamp = Math.round(Date.now() / 1000);
    const query = {
        text: updateSessionActivityTime,
        values: [nowTimestamp, sessionId]
    };

    return await (await pgClient.query(query))
}


module.exports = { getNewSessionOptionsQuery, getSessionsByStatusQuery, createNewSessionQuery, getSessionDataQuery, getSessionReportQuery, getSessionOrderItemsQuery, getSessionOrdersCountQuery, getSessionQuickNotesQuery, getSessionDiscountOptionsQuery, endSessionQuery, searchSessionsByDateQuery, updateSessionUpdatedTime };
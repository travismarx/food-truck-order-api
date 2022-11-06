const sessionReportQuery = `
SELECT
    s.session_id as "sessionId",
    s.title,
    s.status,
    s.session_type_id as "sessionTypeId",
    s.menu_type_id as "menuTypeId",
    s.created_dt as "createdDate",
    s.created_timestamp::integer as "createdTimestamp",
    s.finished_timestamp::integer as "finishedTimestamp",
    st.title as "sessionTypeTitle",
    st.session_type_id as "sessionTypeId",
	(to_char(sum(o.total_cost)::numeric, '9999999999.00'))::numeric as "totalEarnings",
    (to_char(avg(o.total_cost)::numeric, '9999999999.00'))::numeric as "avgEarnings"
FROM sessions s
LEFT JOIN session_types st ON s.session_type_id = st.session_type_id
LEFT JOIN orders o on s.session_id = o.session_id
WHERE s.session_id = $1
GROUP BY s.session_id, st.title, st.session_type_id;
`;

const sessionOrderItemsQuery = `
select 
	oi.quantity,
	oi.total_cost as "totalCost",
	oi.menu_item_id,
	mi.stub,
	mi.title,
    mi.color_code as "colorCode",
    mi.menu_item_id as "menuItemId"
from order_items oi
left join menu_items mi on oi.menu_item_id = mi.menu_item_id
left join orders o ON oi.order_id = o.order_id
left join sessions s on o.session_id = s.session_id
where s.session_id = $1;
`;

const sessionOrdersCountQuery = `
    SELECT COUNT(*)
    FROM orders o
    WHERE o.session_id = $1;
`;

const updateSessionActivityTime = `
    UPDATE sessions
    SET updated_timestamp = $1
    WHERE session_id = $2;
`;

module.exports = { sessionReportQuery, sessionOrderItemsQuery, sessionOrdersCountQuery, updateSessionActivityTime };
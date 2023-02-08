const pgClient = require('../../config/postgres');

const getAllMenuItemsQuery = async () => {
    const query = {
        text: `
        SELECT 
            mi.menu_item_id as "menuItemId",
            mi.title,
            mi.stub as "stub",
            mi.color_code as "colorCode",
            mi.ignore_in_order as "ignore",
            mi.default_price as "defaultPrice",
            nm.menu_type_id as "menuTypeId",
            nm.price,
            mt.title as "menuTitle",
            mt.saved = true
        FROM menu_items mi
        LEFT JOIN new_menus nm on mi.menu_item_id = nm.menu_item_id
        LEFT JOIN menu_types mt on nm.menu_type_id = mt.menu_type_id 
        ORDER BY mi.menu_item_id
        `
    };

    return (await pgClient.query(query)).rows;
}

const getMenuTypesQuery = async () => {
    const query = {
        text: `
            SELECT
                mt.menu_type_id as "menuTypeId",
                mt.title
            FROM menu_types mt
            WHERE mt.saved = true
        `
    };

    return (await pgClient.query(query)).rows;
}

const getNewEmptyMenuQuery = async () => {
    const query = {
        text: `
        SELECT
            menu_item_id as "menuItemId",
            title,
            stub,
            color_code as "colorCode",
            COALESCE(default_price, 0) as "price"
        FROM menu_items mi
        ORDER BY menu_item_id
        `
    };

    return (await pgClient.query(query)).rows;
}

const createNewMenuType = async (menuTitle, saved) => {
    const query = {
        text: `
        INSERT INTO menu_types(title, saved) VALUES ($1, $2) RETURNING menu_type_id as "menuTypeId"
        `,
        values: [menuTitle, saved]
    };

    return (await pgClient.query(query)).rows;
}

const insertNewMenu = async (menuItemsArray) => {
    const preparedArray = [];
    for (let k = 0; k < Object.keys(menuItemsArray[0]).length; k++) {
        preparedArray[k] = [];
        for (let i = 0; i < menuItemsArray.length; i++) {
            preparedArray[k].push(Object.values(menuItemsArray[i])[k])
        }
    }
    const query = {
        text: `
        INSERT INTO new_menus(menu_type_id, menu_item_id, price) 
        SELECT * FROM UNNEST ($1::int[], $2::int[], $3::int[])
        `,
        values: [...preparedArray]
    };

    return (await pgClient.query(query));
}

const getSessionMenuQuery = async (menuTypeId) => {
    const query = {
        text: `
        SELECT 
            mi.menu_item_id as "menuItemId",
            mi.title,
            mi.stub as "stub",
            mi.color_code as "colorCode",
            mi.ignore_in_order as "ignore",
            nm.menu_type_id as "menuTypeId",
            nm.price,
            mt.title as "menuTitle",
            mt.saved = true
        FROM menu_items mi
        LEFT JOIN new_menus nm on mi.menu_item_id = nm.menu_item_id
        LEFT JOIN menu_types mt on nm.menu_type_id = mt.menu_type_id
        WHERE nm.menu_type_id = $1
        ORDER BY nm.menu_item_id;
        `,
        values: [menuTypeId]
    };

    return (await pgClient.query(query)).rows;
}

module.exports = {
    getAllMenuItemsQuery,
    getMenuTypesQuery,
    getNewEmptyMenuQuery,
    createNewMenuType,
    insertNewMenu,
    getSessionMenuQuery
};
const { getAllMenuItemsQuery, getMenuTypesQuery, getNewEmptyMenuQuery } = require('./menus.repository');

const getAllMenuOptions = async (req, res) => {
    try {
        const menuTypes = await getMenuTypesQuery();
        const menuItems = await getAllMenuItemsQuery();
        const newEmptyMenu = await getNewEmptyMenuQuery();

        const mergedMenuTypesAndItems = [{
            title: 'New Menu +', menuTypeId: 0, items: newEmptyMenu
        }, ...menuTypes.map(menuType => {
            return {
                ...menuType,
                items: menuItems.filter(item => item.menuTypeId === menuType.menuTypeId)
            }
        }).sort((a, b) => a.menuTypeId - b.menuTypeId)];

        res.send(mergedMenuTypesAndItems);

    } catch (error) {
        console.log('ERROR GETTING ALL MENUS: ', error);
    }
}

module.exports = { getAllMenuOptions };
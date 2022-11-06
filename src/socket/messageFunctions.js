const messages = require('./messages.enum');

const messageFunctions = {
    [messages.joinSessionRoom]: (socket, [message], io) => {
        console.log('JOIN SESSION ROOM: ', message);
        socket.join(message);
        io.to(message).emit('new-order', 'new order submitted');
    },

    [messages.leaveSessionRoom]: (socket, [message], io) => {
        console.log('LEAVE SESSION ROOM: ', message);
        socket.leave(message);
    }
};

module.exports = messageFunctions;
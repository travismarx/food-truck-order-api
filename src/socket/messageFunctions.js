const messages = require('./messages.enum');

const messageFunctions = {
    [messages.joinSessionRoom]: (socket, [message], io) => {
        socket.join(message);
        io.to(message).emit('new-order', 'new order submitted');
    },

    [messages.leaveSessionRoom]: (socket, [message], io) => {
        socket.leave(message);
    }
};

module.exports = messageFunctions;
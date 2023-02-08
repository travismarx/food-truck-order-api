const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origins: ['http://localhost:4200', 'https://corndog.pulpmxfantasy.com', 'https://corndog.pulpmxfantasy.com/*']
    }
});
const messageFunctions = require("./socket/messageFunctions");
const { closeForgottenSessions } = require('./api/sessions/sessions.service');

io.on('connection', (socket) => {
    socket.onAny((event, ...args) => {
        if (messageFunctions[event]) {
            messageFunctions[event](socket, args, io);
        }
    });
    socket.on('disconnect', () => {
    });
});

const intervalTasks = () => {
    setInterval(() => {
        closeForgottenSessions();
    }, 600000);
}

module.exports = { app, http, io, intervalTasks };
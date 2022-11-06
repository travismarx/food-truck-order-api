require("dotenv").config();
// const express = require('express');
// const app = express();
// const http = require('http').createServer(app);
// const io = require('socket.io')(http, {
//     cors: {
//         origins: ['http://localhost:4200']
//     }
// });
const { app, http, io, intervalTasks } = require('./src/server');
// const server = http.createServer(app);
const port = process.env.PORT;
const nocache = require("nocache");
const messageFunctions = require("./src/socket/messageFunctions");


// const { Server } = require("socket.io");

const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require('body-parser');

// Route handlers
const ordersRoute = require('./src/api/orders/orders.routes');
const sessionsRoute = require('./src/api/sessions/sessions.routes');
const menusRoute = require('./src/api/menus/menus.routes');


app.get('/', (req, res) => {
    res.send('Hello World!')
});

// function nocache(req, res, next) {
//     res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
//     res.header('Expires', '-1');
//     res.header('Pragma', 'no-cache');
//     next();
// }

app.use(nocache());
app.use(cors());
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "1mb" }));
app.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.set('Cache-Control', 'no-store')
    next()
});

app.use(function (req, res, next) {
    res.setTimeout(30000, function () {
        console.log('Request has timed out.');
        res.send(408);
    });

    next();
});

app.use('/orders', ordersRoute);
app.use('/sessions', sessionsRoute);
app.use('/menus', menusRoute);

// io.on('connection', (socket) => {
//     console.log('a user connected');
//     socket.onAny((event, ...args) => {
//         console.log('SOCKET EVENT: ', event);
//         console.log('EVENT DATA: ', args);
//         if (messageFunctions[event]) {
//             messageFunctions[event](socket, args, io);
//         }
//     });
//     socket.on('disconnect', () => {
//         console.log('user disconnected');
//     });
// });

intervalTasks();

http.listen(port, () => {
    console.log('listening on *:3000');
});

// module.exports = { io };
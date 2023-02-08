require("dotenv").config();
const { app, http, io, intervalTasks } = require('./src/server');
const port = process.env.PORT;
const nocache = require("nocache");

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

intervalTasks();

http.listen(port, () => {
    console.log('listening on *:3000');
});
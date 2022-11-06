const { Client, Pool } = require("pg");
const fs = require("fs");
const connectionString = process.env.POSTGRES_CONNECTION_STRING;

const pgClient = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false,
        ca: fs.readFileSync("./ca-certificate.crt").toString()
        // key: fs.readFileSync("/path/to/client-key/postgresql.key").toString(),
        // cert: fs.readFileSync("/path/to/client-certificates/postgresql.crt").toString()
    }
});

pgClient.connect();

module.exports = pgClient;
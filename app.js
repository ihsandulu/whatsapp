
// const { Client, LocalAuth } = require('whatsapp-web.js');
const { Client, Location, List, Buttons, LocalAuth } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIo = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const { response } = require('express');
const { formatWithOptions } = require('util');
const { fungsinya } = require('./fungsi');
const { routingnya } = require('./routing');
const { phoneNumberFormatter } = require('./formatter');
// const https = require('https');
// const fs = require('fs');

/* const SESSION_FILE_PATH = './whatsapp-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) { sessionCfg = require(SESSION_FILE_PATH); } */

// const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//jika pake ssl
/* var options = {
    ca: fs.readFileSync('ca_bundle.crt'),
    cert: fs.readFileSync('certificate.crt'),
    key: fs.readFileSync('private.key')
}; 
const server = https.createServer(options, app);
*/

const server = http.createServer(app);
const io = socketIo(server);

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-one"/* ,
        session: sessionCfg */
    }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'] }
});

client.initialize();

/* client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, session, (err) => {
        if (err) { console.log(err); }
    })
}); */


//socket.io
io.on('connection', function (socket) {

    fungsinya(client, socket);

})

routingnya(body, validationResult, phoneNumberFormatter, app, client);

server.listen(8000, function () {
    console.log('App running on *:', 8000);
});
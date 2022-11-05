require('dotenv').config();
// const { Client, LocalAuth } = require('whatsapp-web.js');
const { Client, Location, List, Buttons, LocalAuth, MessageMedia } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIo = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
// const { response } = require('express');
const { formatWithOptions } = require('util');
const { fungsinya } = require('./fungsi');
const { routingnya } = require('./routing');
const { phoneNumberFormatter } = require('./formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');

//----vps----//
const https = require('https');
const fs = require('fs');

/* const SESSION_FILE_PATH = './whatsapp-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) { sessionCfg = require(SESSION_FILE_PATH); } */

// const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    debug: false
}));
app.use(express.static(__dirname));

//----vps----//
//jika pake ssl

var options = {
    ca: fs.readFileSync('ca_bundle.crt'),
    cert: fs.readFileSync('certificate.crt'),
    key: fs.readFileSync('private.key')
};
let server = '';
if (process.env.APP_HOST == 'server') {
    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}

const io = socketIo(server);

const klien = [];

//------server---------//
/* const id1 = "server";
const client1 = new Client({
    authStrategy: new LocalAuth({
        clientId: id1
        // , session: sessionCfg
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',//this one doesn't work in windows
            '--disable-gpu'
        ]
    }
});

client1.initialize(); */

/* klien.push({
    id: 'server',
    description: 'Default Server',
    client: client1
}); */

/* client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, session, (err) => {
        if (err) { console.log(err); }
    })
}); */

const checkRegisteredNumber1 = async function (number) {
    const isRegistered = await client1.isRegisteredUser(number);
    return isRegistered;
}

routingnya(body, validationResult, phoneNumberFormatter, app, klien, checkRegisteredNumber1, MessageMedia, axios);

//------server---------//



//per client
const stat = async (client, socket, id) => {
    let status = await client.getState();
    socket.emit('message', { id: id, message: status });
    console.log('Status:', id + ' ' + status);
}
const createSession = function (id, description, socket) {
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: id/* ,
            session: sessionCfg */
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-extensions',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',//this one doesn't work in windows
                '--disable-gpu'
            ]
        }
    });
    client.initialize();

    klien.push({
        id: id,
        description: description,
        client: client
    });

    const checkRegisteredNumber = async function (number) {
        const isRegistered = await client.isRegisteredUser(number);
        return isRegistered;
    }

    fungsinya(client, socket, qrcode, checkRegisteredNumber, MessageMedia, axios, id, stat);
}

//cek json format
function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

//socket.io
io.on('connection', function (socket) {

    socket.on('create-session', function (data) {
        // console.log(data.id + '=' + data.description);
        console.log(data);
        createSession(data.id, data.description, socket);
    });

    // fungsinya(client1, socket, qrcode, checkRegisteredNumber1, MessageMedia, axios, id1);

    socket.emit('title', process.env.APP_NAME);
    console.log('Socket Connected');

});

createSession('server', 'wa server', io);



server.listen(8001, function () {
    console.log('App running on *:', 8001);
    setTimeout(() => {
        console.log('Restart Frontend');
        io.emit('restart', 'yes');
    }, 1000);
});

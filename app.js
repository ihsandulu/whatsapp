
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
const { phoneNumberFormatter } = require('./helpers/formatter');
// const https = require('https');
// const fs = require('fs');

/* const SESSION_FILE_PATH = './whatsapp-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) { sessionCfg = require(SESSION_FILE_PATH); } */

// const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });

const app = express();

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    socket.emit('message', 'Tersambung...');

    client.on('loading_screen', (percent, message) => {
        console.log('LOADING SCREEN', percent, message);
        socket.emit('message', 'LOADING SCREEN' + percent + ' ' + message);
    });

    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        console.log('QR RECEIVED', qr);
        // qrcode.generate(qr, { small: true });
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('dqr', '1');
            socket.emit('message', qr + '<br/>' + url);
        });
    });

    client.on('authenticated', () => {
        console.log('AUTHENTICATED');
        socket.emit('message', 'AUTHENTICATED');
    });

    client.on('auth_failure', msg => {
        // Fired if session restore was unsuccessful
        console.error('AUTHENTICATION FAILURE', msg);
        socket.emit('message', 'AUTHENTICATION FAILURE ' + msg);
    });

    client.on('ready', () => {
        console.log('READY');
        socket.emit('message', 'Whatsapp Bot berjalan...');
        socket.emit('dqr', '0');
    });

    client.on('disconnected', (reason) => {
        console.log('Client was logged out', reason);
        socket.emit('message', 'Anda telah logout...' + reason);
        socket.emit('dqr', '1');
    });

    client.on('message', async msg => {
        console.log('MESSAGE RECEIVED', msg);

        if (msg.body === '!ping') {
            msg.reply('pong');
            socket.emit('message', 'pong');
        }
    });






    /* process.on("SIGINT", async () => {
        console.log("(SIGINT) Shutting down...");
        await client.destroy();
        process.exit(0);
    }) */
})


app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

app.get('/send-message', (req, res) => {
    const number = req.query.number;
    const message = req.query.message;

    // client.sendMessage('628567148813@c.us', number + '=' + message);
    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: number + '=' + message
        });
    });
});

//send message API
app.post('/send-message',
    body('number').notEmpty(),
    body('message').notEmpty()
    , (req, res) => {
        const errors = validationResult(req).formatWith(({ msg }) => {
            return msg;
        });
        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: false,
                message: errors.mapped()
            });
        }
        const number = phoneNumberFormatter(req.body.number);
        const message = req.body.message;

        // client.sendMessage('628567148813@c.us', number + '=' + message);
        client.sendMessage(number, message).then(response => {
            res.status(200).json({
                status: true,
                response: response
            });
        }).catch(err => {
            res.status(500).json({
                status: false,
                response: number + '=' + message
            });
        });
    });


server.listen(8000, function () {
    console.log('App running on *:', 8000);
});
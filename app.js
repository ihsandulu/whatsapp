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
const { exec } = require("child_process");

//----vps----//
const https = require('https');
const fs = require('fs');

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
klien.length = 0;
console.log(klien);
let date_ob = new Date();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
let timenow = hours + ":" + minutes + ":" + seconds;
setInterval(function () {
    date_ob = new Date();
    hours = date_ob.getHours();
    minutes = date_ob.getMinutes();
    seconds = date_ob.getSeconds();
    timenow = hours + ":" + minutes + ":" + seconds;
    if (timenow == '23:33:30') {
        console.log('Sekarang=' + timenow);
    }
    io.emit('time', timenow);
    console.log(timenow);
}, 1000);

function checkidarray(id) {
    console.log('Memproses pencarian ' + id);
    let data;
    data = { id: false, client: false, description: false, x: false }
    return new Promise(resolve => {
        console.log('Jumlah Array ' + klien.length);
        // console.log(klien);
        if (klien.length > 0) {
            for (let x = 0; x <= klien.length - 1; x++) {
                console.log('Pengulangan ' + x);
                let a = klien[x];
                // console.log(a);
                if (a.id == id) {
                    console.log('Cari ' + id + ' ditemukan');
                    data = { id: a.id, client: a.client, description: a.description, x: x }
                    console.log('Berhasil mencari ' + id);
                }else{
                    // klien.splice(x, 1);
                }
            }
        }
        if (data.id == false) { console.log('Gagal mencari ' + id); }
        resolve(data);
    });
}

const arrayRemove = async function (id) {
    let acheckidarray = await checkidarray(id);
    let status;
    if (acheckidarray.id != false) {
        klien.splice(acheckidarray.x, 1);
        status = 'Remove ' + id + ' Berhasil';
    } else {
        status = 'Remove ' + id + ' Gagal!';
    }
    console.log('Remove Status:', id + ' ' + status);
    console.log('Jumlah Klien:', klien.length);
    console.log(klien);
}

//per client
const stat = async (arr, socket, id) => {
    let acheckidarray = await checkidarray(id);
    let client;
    if (acheckidarray.id != false) {
        client = acheckidarray.client;
        let status = await client.getState();
        if (status == null) {
            status = timenow + ' Whatsapp tidak berjalan!';
            // socket.emit('message', { id: id, message: status });
        } else {
            socket.emit('message', { id: id, message: status });
            socket.emit('loading', { id: id, loading: 0 });
            socket.emit('logout', { id: id, logout: 1 });
        }
        console.log('Status:', id + ' ' + status);
    }
}

const logout = async function (arr, id, socket) {
    console.log('Memproses Logout');
    let acheckidarray = await checkidarray(id);
    let status;
    let client;
    if (acheckidarray.id != false) {
        client = acheckidarray.client;
        await client.logout();
        status = 'Logout Berhasil';
        socket.emit('logout', { id: id, logout: 0 });
        socket.emit('loading', { id: id, loading: 1 });
    } else {
        status = 'Logout Gagal!';
        socket.emit('logout', { id: id, logout: 1 });
        socket.emit('loading', { id: id, loading: 0 });
    }
    socket.emit('message', { id: id, message: status });
    console.log(status);
    console.log(arr);
}

const mulai = function () {
    /* server.close((err) => {
        io.emit('restart', 'yes');
        console.log('server closed');
        // process.exit(err ? 1 : 0)
        server.listen(8000, function () {
            console.log('App running on *:', 8000);
            setTimeout(() => {
                console.log('Restart Frontend');
                io.emit('restart', 'yes');
            }, 1000);
        });
    }); */
    server.listen(process.env.port, process.env.hostname, function () {
        console.log('App running on *:', process.env.hostname + ':' + process.env.port);
        setTimeout(() => {
            console.log('Restart Frontend');
            io.emit('restart', 'yes');
        }, 1000);
    });
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
    const checkRegisteredNumber = async function (number) {
        const isRegistered = await client.isRegisteredUser(number);
        return isRegistered;
    }
    arrayRemove(klien, id);
    klien.push({
        id: id,
        description: description,
        client: client,
        fungsinya: fungsinya(client, socket, qrcode, checkRegisteredNumber, MessageMedia, axios, id, stat, app, mulai)
    });
    klien.fungsinya;
}
const reloadSession = function (id, client, socket) {
    /* const checkRegisteredNumber = async function (number) {
        const isRegistered = await client.isRegisteredUser(number);
        return isRegistered;
    } */
    // fungsinya(client, socket, qrcode, checkRegisteredNumber, MessageMedia, axios, id, stat, app, mulai);
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

//ceksession
let ceksession = async function (data, socket) {
    console.log('request data for = ' + data.id);
    let acheckidarray = await checkidarray(data.id);
    if (acheckidarray.id == false) {
        console.log('Buat session baru untuk ' + data.id);
        createSession(data.id, data.description, socket);
    } else {
        console.log('Restore Klien : ' + data.id);
        // reloadSession(data.id, client, socket);
    }
}

//socket.io
io.on('connection', function (socket) {
    socket.on('create-session', function (data) {
        ceksession(data, socket);
    });
    socket.on('logout', function (data) {
        console.log('Require Logout ' + data.id);
        logout(klien, data.id, socket);
    });
    socket.emit('title', process.env.APP_NAME);
    console.log('Socket Connected');
    // mulai();
});

//buka server
// createSession('server', 'wa server', io);

console.log(process.env.serverwa + '/api/getallclientwa');
axios.get(process.env.serverwa + '/api/getallclientwa')
    .then(response => {
        const children = response.data;
        for (var i = 0; i < children.length; i++) {
            console.log('Membuat Session = ', children[i].tranprod_no);
            createSession(children[i].tranprod_no, children[i].tranprod_no, io);
            let data = {
                id: children[i].tranprod_no,
                description: children[i].tranprod_note
            }
            ceksession(data, io);
        }
    })
    .catch(error => {
        console.log('err = ', error);
    });

routingnya(body, validationResult, phoneNumberFormatter, app, klien, MessageMedia, axios);

mulai();





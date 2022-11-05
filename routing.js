function routingnya(body, validationResult, phoneNumberFormatter, app, klien, MessageMedia, axios) {

    const checkRegisteredNumber = async function (number, client) {
        const isRegistered = await client.isRegisteredUser(number);
        return isRegistered;
    }

    app.get('/', (req, res) => {
        res.sendFile('index.html', { root: __dirname });
    });


    app.get('/send-message',
        [body('number').notEmpty(),
        body('message').notEmpty(),],
        async (req, res) => {
            const id = req.query.id;
            const number = phoneNumberFormatter(req.query.number);
            const message = req.query.message;
            const client = klien.find(sess => sess.id == id).client;

            try {
                const isRegisteredNumber = await checkRegisteredNumber(number, client);
            } catch (err) {
                res.status(422).json({
                    status: false,
                    message: 'Nomor tidak teregister!'
                });
            }

            // client.sendMessage('628567148813@c.us', number + '=' + message);
            client.sendMessage(number, message).then(response => {
                res.status(200).json({
                    status: true,
                    message: response
                });
            }).catch(err => {
                res.status(500).json({
                    status: false,
                    message: number + '=' + message
                });
            });
        });

    //send message API
    app.post('/send-message',
        [body('number').notEmpty(),
        body('message').notEmpty(),],
        async (req, res) => {
            const errors = validationResult(req).formatWith(({ msg }) => {
                return msg;
            });
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    status: false,
                    message: errors.mapped()
                });
            }
            const id = req.body.id;
            const number = phoneNumberFormatter(req.body.number);
            const message = req.body.message;
            const client = klien.find(sess => sess.id == id).client;

            try {
                const isRegisteredNumber = await checkRegisteredNumber(number);
            } catch (err) {
                res.status(422).json({
                    status: false,
                    message: 'Nomor tidak teregister!'
                });
            }

            client.sendMessage('628567148813@c.us', number );
            /* client.sendMessage(number, message).then(response => {
                res.status(200).json({
                    status: true,
                    message: response
                });
                console.log("Ada pesan wa!!!");
            }).catch(err => {
                res.status(500).json({
                    status: false,
                    message: number + '=' + message
                });
                console.log("Gagal mengirim wa!!!");
            }); */
        });

    //send media file
    app.post('/send-media-file',
        [body('number').notEmpty(),],
        async (req, res) => {
            const errors = validationResult(req).formatWith(({ msg }) => {
                return msg;
            });
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    status: false,
                    message: errors.mapped()
                });
            }
            const id = req.body.id;
            const number = phoneNumberFormatter(req.body.number);
            const caption = req.body.caption;
            const client = klien.find(sess => sess.id == id).client;
            // const media = MessageMedia.fromFilePath('./gambar.png');            
            const file = req.files.file;
            console.log(file);

            try {
                const isRegisteredNumber = await checkRegisteredNumber(number);
            } catch (err) {
                res.status(422).json({
                    status: false,
                    message: 'Nomor tidak teregister!'
                });
            }

            try {
                const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
                // client.sendMessage('628567148813@c.us', number + '=' + message);
                client.sendMessage(number, media, { caption: caption }).then(response => {
                    res.status(200).json({
                        status: true,
                        message: response
                    });
                }).catch(err => {
                    res.status(500).json({
                        status: false,
                        message: number + '=' + message
                    });
                });
            } catch (err) {
                res.status(422).json({
                    status: false,
                    message: err
                });
            }


        });

    //send media url
    app.post('/send-media-url',
        [body('number').notEmpty(),],
        async (req, res) => {
            const errors = validationResult(req).formatWith(({ msg }) => {
                return msg;
            });
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    status: false,
                    message: errors.mapped()
                });
            }
            const id = req.body.id;
            const number = phoneNumberFormatter(req.body.number);
            const caption = req.body.caption;
            const fileUrl = req.body.file;
            const client = klien.find(sess => sess.id == id).client;

            let mimetype;
            const attachment = await axios.get(fileUrl, { responseType: 'arraybuffer' }).then(response => {
                mimetype = response.headers['content-type'];
                return response.data.toString('base64');
            });
            const media = new MessageMedia(mimetype, attachment, 'Media');

            try {
                const isRegisteredNumber = await checkRegisteredNumber(number);
            } catch (err) {
                res.status(422).json({
                    status: false,
                    message: 'Nomor tidak teregister!'
                });
            }

            // client.sendMessage('628567148813@c.us', number + '=' + message);
            client.sendMessage(number, media, { caption: caption }).then(response => {
                res.status(200).json({
                    status: true,
                    message: response
                });
            }).catch(err => {
                res.status(500).json({
                    status: false,
                    message: number + '=' + message
                });
            });
        });
}

module.exports = {
    routingnya
}

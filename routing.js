function routingnya(body, validationResult, phoneNumberFormatter, app, client, checkRegisteredNumber) {

    app.get('/', (req, res) => {
        res.sendFile('index.html', { root: __dirname });
    });

    app.get('/send-message',
        [body('number').notEmpty(),
        body('message').notEmpty(),],
        async (req, res) => {
            const number = phoneNumberFormatter(req.query.number);
            const message = req.query.message;

            try {
                const isRegisteredNumber = await checkRegisteredNumber(number);
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
            const number = phoneNumberFormatter(req.body.number);
            const message = req.body.message;

            try {
                const isRegisteredNumber = await checkRegisteredNumber(number);
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
}
module.exports = {
    routingnya
}

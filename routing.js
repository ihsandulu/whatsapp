function routingnya(body, validationResult, phoneNumberFormatter, app, client) {

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
}
module.exports = {
    routingnya
}

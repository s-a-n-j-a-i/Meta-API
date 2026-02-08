// Import Express.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests
// Route for GET requests
app.get('/', (req, res) => {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

    console.log('Incoming webhook verification attempt:');
    console.log('Mode:', mode);
    console.log('Token:', token);
    console.log('Expected Token:', verifyToken);

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('WEBHOOK VERIFIED');
        res.status(200).send(challenge);
    } else {
        console.log('WEBHOOK VERIFICATION FAILED');
        res.status(403).end();
    }
});

// Route for POST requests
app.post('/', async (req, res) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    console.log(`\n\nWebhook received ${timestamp}\n`);
    console.log(JSON.stringify(req.body, null, 2));

    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
            const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            const from = body.entry[0].changes[0].value.messages[0].from;
            const msg_body = body.entry[0].changes[0].value.messages[0].text.body;

            console.log('Phone number ID:', phone_number_id);
            console.log('From:', from);
            console.log('Message body:', msg_body);

            try {
                await axios({
                    method: 'POST',
                    url: `https://graph.facebook.com/v13.0/${phone_number_id}/messages`,
                    data: {
                        messaging_product: 'whatsapp',
                        to: from,
                        text: { body: msg_body },
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    },
                });
                console.log('Message echoed successfully');
            } catch (error) {
                console.error('Error sending message:', error.response ? error.response.data : error.message);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`\nListening on port ${port}\n`);
});
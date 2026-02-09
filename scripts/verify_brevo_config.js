const axios = require('axios');

// Configuration - REPLACE WITH YOUR ACTUAL VALUES FOR TESTING
const BREVO_API_KEY = process.env.MORNING_PULSE_BREVO || 'YOUR_BREVO_API_KEY';
const NEWSLETTER_FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'buynsellpvtltd@gmail.com';
const NEWSLETTER_FROM_NAME = 'Morning Pulse News';
const TEST_EMAIL = process.env.TEST_EMAIL || 'shadreckmusarurwa@gmail.com'; // Default to user email if not set

async function verifyBrevoConfig() {
    console.log('--- Verifying Brevo Configuration ---');
    console.log(`API Key Length: ${BREVO_API_KEY ? BREVO_API_KEY.length : 'MISSING'}`);
    console.log(`Sender: ${NEWSLETTER_FROM_NAME} <${NEWSLETTER_FROM_EMAIL}>`);
    console.log(`Test Recipient: ${TEST_EMAIL}`);

    if (!BREVO_API_KEY || BREVO_API_KEY === 'YOUR_BREVO_API_KEY') {
        console.error('❌ CRITICAL: Brevo API key is missing or not set.');
        console.log('👉 usage: MORNING_PULSE_BREVO=xkeysib-... node verify_brevo_config.js');
        return;
    }

    try {
        console.log(`\n📡 Attempting Brevo API call to: ${TEST_EMAIL}`);

        const payload = {
            sender: {
                email: NEWSLETTER_FROM_EMAIL,
                name: NEWSLETTER_FROM_NAME
            },
            to: [{ email: TEST_EMAIL, name: 'Test User' }],
            subject: 'Morning Pulse - Configuration Verification',
            htmlContent: '<h1>It Works!</h1><p>This email confirms that your Brevo API key and Sender configuration are correct.</p>',
            headers: {
                'List-Unsubscribe': `<mailto:${NEWSLETTER_FROM_EMAIL}?subject=Unsubscribe>`,
            }
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        console.log(`✅ Brevo success! MessageID: ${response.data.messageId}`);
        console.log('\n--> Please check your inbox (and spam folder) for the verification email.');
        console.log('--> Also check the Brevo Dashboard > Transactional > Logs.');

    } catch (error) {
        console.error('\n❌ Brevo API Failure:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));

            if (error.response.data.code === 'unauthorized') {
                console.log('\n👉 Tip: Check if your API Key is correct.');
            } else if (error.response.data.message && error.response.data.message.includes('sender')) {
                console.log('\n👉 Tip: The Sender email might not be verified in Brevo.');
            }
        } else {
            console.error(error.message);
        }
    }
}

// Run the verification
verifyBrevoConfig();

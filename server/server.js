const express = require('express');
const cors = require('cors');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        const { to, subject, pdfUrl, recipientName } = req.body;

        if (!to || !subject || !pdfUrl || !recipientName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        console.log('Attempting to fetch PDF from:', pdfUrl);

        const pdfResponse = await axios.get(pdfUrl, {
            responseType: 'arraybuffer'
        });

        console.log('PDF fetched successfully, converting to base64');
        const pdfBase64 = Buffer.from(pdfResponse.data).toString('base64');

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: to, name: recipientName }];
        sendSmtpEmail.sender = {
            email: process.env.SENDINBLUE_FROM_EMAIL,
            name: 'HR Team'
        };

        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = `
     <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Hello ${recipientName},</h2>
              <p>Your Offer Letter is ready for download.</p>
              <p>You can access your Offer Letter by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${pdfUrl}"
                    style="background-color: #7c3aed; color: white; padding: 12px 24px;
                           text-decoration: none; border-radius: 4px; display: inline-block;">
                  View Offer Letter
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                If the button doesn't work, you can copy and paste this link into your browser:
                <br>
                ${pdfUrl}
              </p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
    `;
        sendSmtpEmail.attachment = [{
            content: pdfBase64,
            name: `${recipientName}_offer-letter.pdf`
        }];

        console.log('Attempting to send email to:', to);
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', result);

        res.status(200).json({
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send email',
            details: error.response?.text || 'No additional details available'
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Sendinblue API Key:', process.env.SENDINBLUE_API_KEY ? 'Set' : 'Not Set');
    console.log('Sendinblue From Email:', process.env.SENDINBLUE_FROM_EMAIL);
});
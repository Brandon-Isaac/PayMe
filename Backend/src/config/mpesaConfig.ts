import dotenv from 'dotenv';
dotenv.config();

export const mpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  passkey: process.env.MPESA_PASSKEY || '',
  shortCode: process.env.MPESA_SHORTCODE || '',
  callbackUrl: process.env.CALLBACK_URL || 'https://yourdomain.com/api/payment/callback',
  baseUrl: 'https://sandbox.safaricom.co.ke' // Change to production URL for live environment
};
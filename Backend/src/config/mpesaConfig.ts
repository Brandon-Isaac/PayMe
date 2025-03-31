import dotenv from "dotenv";
dotenv.config();

export const mpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortCode: process.env.MPESA_SHORTCODE,
  callbackUrl:
    process.env.CALLBACK_URL ||
    "https://9f14-41-139-222-155.ngrok-free.app/api/payment/callback",
  baseUrl: "https://sandbox.safaricom.co.ke",
};

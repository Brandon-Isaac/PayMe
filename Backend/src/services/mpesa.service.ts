import axios from "axios";
import { mpesaConfig } from "../config/mpesaConfig";

export class MpesaService {
  private async getAuthToken(): Promise<string> {
    // Check if credentials are properly set
    if (!mpesaConfig.consumerKey || !mpesaConfig.consumerSecret) {
      throw new Error(
        "M-Pesa API credentials are missing. Please check your environment variables."
      );
    }

    // Create the correct base64 authentication string
    const auth = Buffer.from(
      `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`
    ).toString("base64");

    try {
      console.log("Attempting to get auth token from Safaricom API...");

      const response = await axios.get(
        `${mpesaConfig.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      console.log("Auth token received successfully");
      return response.data.access_token;
    } catch (error: any) {
      console.error("Error data:", error.response?.data || "No response data");
      console.error(
        "Error status:",
        error.response?.status || "No status code"
      );
      console.error("Error headers:", error.response?.headers || "No headers");
      throw new Error("Failed to get M-Pesa auth token");
    }
  }

  public async initiateSTKPush(
    phoneNumber: string,
    amount: number,
    description: string
  ): Promise<any> {
    try {
      // Get auth token
      console.log("Getting auth token for STK push...");
      const token = await this.getAuthToken();

      // Generate timestamp in the format required by Safaricom (YYYYMMDDHHmmss)
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:\.]/g, "")
        .substring(0, 14);

      // Generate password (shortcode + passkey + timestamp)
      if (!mpesaConfig.shortCode || !mpesaConfig.passkey) {
        throw new Error(
          "M-Pesa shortcode or passkey is missing. Please check your environment variables."
        );
      }

      const password = Buffer.from(
        `${mpesaConfig.shortCode}${mpesaConfig.passkey}${timestamp}`
      ).toString("base64");

      console.log(
        "Initiating STK push to phone number:",
        this.formatPhoneNumber(phoneNumber)
      );

      const response = await axios.post(
        `${mpesaConfig.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: mpesaConfig.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: this.formatPhoneNumber(phoneNumber),
          PartyB: mpesaConfig.shortCode,
          PhoneNumber: this.formatPhoneNumber(phoneNumber),
          CallBackURL: mpesaConfig.callbackUrl,
          AccountReference: `Payment ${Date.now()}`,
          TransactionDesc: description || "Payment",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("STK push successful:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "STK Push failed details:",
        error.response?.data || "No response data"
      );
      throw new Error("Failed to initiate M-Pesa payment");
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Format to required format (254XXXXXXXXX)
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Check if it starts with 0
    if (cleaned.startsWith("0")) {
      return `254${cleaned.substring(1)}`;
    }

    // Check if it already has country code
    if (cleaned.startsWith("254")) {
      return cleaned;
    }

    // Otherwise add country code
    return `254${cleaned}`;
  }
}

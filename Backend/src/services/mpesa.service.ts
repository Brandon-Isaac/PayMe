import axios from 'axios';
import { mpesaConfig } from '../config/mpesaConfig';

export class MpesaService {
  private async getAuthToken(): Promise<string> {
    const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
    
    try {
      const response = await axios.get(
        `${mpesaConfig.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Failed to get M-Pesa auth token');
    }
  }

  public async initiateSTKPush(phoneNumber: string, amount: number, description: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').substring(0, 14);
      const password = Buffer.from(
        `${mpesaConfig.shortCode}${mpesaConfig.passkey}${timestamp}`
      ).toString('base64');

      const response = await axios.post(
        `${mpesaConfig.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: mpesaConfig.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: this.formatPhoneNumber(phoneNumber),
          PartyB: mpesaConfig.shortCode,
          PhoneNumber: this.formatPhoneNumber(phoneNumber),
          CallBackURL: mpesaConfig.callbackUrl,
          AccountReference: `Gift Payment ${Date.now()}`,
          TransactionDesc: description || 'Gift Payment'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('STK Push failed:', error);
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Format to required format (254XXXXXXXXX)
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Check if it starts with 0
    if (cleaned.startsWith('0')) {
      return `254${cleaned.substring(1)}`;
    }
    // Check if it already has country code
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    // Otherwise add country code
    return `254${cleaned}`;
  }
}

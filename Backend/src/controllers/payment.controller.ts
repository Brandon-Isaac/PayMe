import { Request, Response } from "express";
import { MpesaService } from "../services/mpesa.service";
import { Payment } from "../models/Payment";

export class PaymentController {
  private mpesaService: MpesaService;

  constructor() {
    this.mpesaService = new MpesaService();
  }

  public async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, amount, description } = req.body;

      if (!phoneNumber || !amount) {
        res.status(400).json({
          success: false,
          message: "Phone number and amount are required",
        });
        return;
      }

      const result = await this.mpesaService.initiateSTKPush(
        phoneNumber,
        amount,
        description
      );

      // Store the payment details
      await Payment.create({
        transactionId: result.CheckoutRequestID,
        phoneNumber,
        amount,
        description,
        status: "pending",
      });

      res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: {
          checkoutRequestId: result.CheckoutRequestID,
          responseDescription: result.ResponseDescription,
        },
      });
    } catch (error) {
      console.error("Payment initiation error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to initiate payment" });
    }
  }

  public async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { Body } = req.body;

      // Always respond with a success to the M-Pesa API
      res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

      if (Body.stkCallback.ResultCode === 0) {
        // Payment was successful
        const checkoutRequestId = Body.stkCallback.CheckoutRequestID;
        const callbackMetadata = Body.stkCallback.CallbackMetadata.Item;

        // Extract the details
        let mpesaReceiptNumber = "";
        let transactionDate = "";
        let phoneNumber = "";
        let amount = 0;

        callbackMetadata.forEach((item: any) => {
          if (item.Name === "MpesaReceiptNumber")
            mpesaReceiptNumber = item.Value;
          if (item.Name === "TransactionDate") transactionDate = item.Value;
          if (item.Name === "PhoneNumber") phoneNumber = item.Value;
          if (item.Name === "Amount") amount = item.Value;
        });

        // Update the payment record
        await Payment.findOneAndUpdate(
          { transactionId: checkoutRequestId },
          {
            status: "completed",
            mpesaReceiptNumber,
            transactionDate,
            phoneNumber,
            amount,
          }
        );
      } else {
        // Payment failed
        const checkoutRequestId = Body.stkCallback.CheckoutRequestID;
        await Payment.findOneAndUpdate(
          { transactionId: checkoutRequestId },
          { status: "failed" }
        );
      }
    } catch (error) {
      console.error("Callback handling error:", error);
      // Still send success response to M-Pesa
      res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }
  }

  public async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      const payment = await Payment.findOne({ transactionId });

      if (!payment) {
        res.status(404).json({ success: false, message: "Payment not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          status: payment.status,
          transactionId: payment.transactionId,
          amount: payment.amount,
          phoneNumber: payment.phoneNumber,
          createdAt: payment.createdAt,
        },
      });
    } catch (error) {
      console.error("Get payment status error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to get payment status" });
    }
  }
}

import express from "express";
import { PaymentController } from "../controllers/payment.controller";

const router = express.Router();
const paymentController = new PaymentController();

router.post("/initiate", (req, res) =>
  paymentController.initiatePayment(req, res)
);
router.post("/callback", (req, res) =>
  paymentController.handleCallback(req, res)
);
router.get("/status/:transactionId", (req, res) =>
  paymentController.getPaymentStatus(req, res)
);

export default router;

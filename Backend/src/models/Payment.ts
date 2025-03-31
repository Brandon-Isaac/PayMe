import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Payment = mongoose.model("Payment", PaymentSchema);

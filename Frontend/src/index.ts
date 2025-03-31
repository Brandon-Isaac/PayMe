interface PaymentData {
  phoneNumber: string;
  amount: number;
  description?: string;
}

interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    checkoutRequestId: string;
    responseDescription: string;
  };
}

interface PaymentStatus {
  success: boolean;
  data?: {
    status: "pending" | "completed" | "failed";
    transactionId: string;
    amount: number;
    phoneNumber: string;
    createdAt: string;
  };
  message?: string;
}

document.addEventListener("DOMContentLoaded", () => {
  const paymentForm = document.getElementById("paymentForm") as HTMLFormElement;
  const paymentStatus = document.getElementById(
    "paymentStatus"
  ) as HTMLDivElement;

  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(paymentForm);
    const paymentData: PaymentData = {
      phoneNumber: formData.get("phoneNumber") as string,
      amount: parseFloat(formData.get("amount") as string),
      description: formData.get("description") as string,
    };

    // Show loading state
    paymentStatus.innerHTML = `
        <h3>Processing Payment...</h3>
        <p>Please check your phone for the M-Pesa prompt.</p>
      `;
    paymentStatus.style.display = "block";

    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const result: PaymentResponse = await response.json();

      if (result.success && result.data) {
        // Payment initiated successfully
        const checkoutRequestId = result.data.checkoutRequestId;

        paymentStatus.innerHTML = `
            <h3>Payment Initiated</h3>
            <p>${result.message}</p>
            <p>Transaction ID: ${checkoutRequestId}</p>
            <p class="status-pending">Status: Pending</p>
            <p>Please enter your M-Pesa PIN on your phone to complete the payment.</p>
          `;

        // Poll for payment status
        pollPaymentStatus(checkoutRequestId);
      } else {
        // Payment initiation failed
        paymentStatus.innerHTML = `
            <h3>Payment Failed</h3>
            <p>${
              result.message ||
              "An error occurred while processing your payment."
            }</p>
            <button class="btn-primary" onclick="location.reload()">Try Again</button>
          `;
      }
    } catch (error) {
      console.error("Payment error:", error);
      paymentStatus.innerHTML = `
          <h3>Payment Failed</h3>
          <p>An unexpected error occurred. Please try again later.</p>
          <button class="btn-primary" onclick="location.reload()">Try Again</button>
        `;
    }
  });

  async function pollPaymentStatus(transactionId: string) {
    try {
      const response = await fetch(`/api/payment/status/${transactionId}`);
      const result: PaymentStatus = await response.json();

      if (result.success && result.data) {
        const { status, amount } = result.data;

        if (status === "completed") {
          // Payment completed successfully
          paymentStatus.innerHTML = `
              <h3>Payment Successful</h3>
              <p class="status-completed">Your payment of KES ${amount} has been received.</p>
              <p>Transaction ID: ${transactionId}</p>
              <p>Thank you for your payment!</p>
              <button class="btn-primary" onclick="location.reload()">Make Another Payment</button>
            `;
          return; // Stop polling
        } else if (status === "failed") {
          // Payment failed
          paymentStatus.innerHTML = `
              <h3>Payment Failed</h3>
              <p class="status-failed">Your payment could not be processed.</p>
              <p>Transaction ID: ${transactionId}</p>
              <button class="btn-primary" onclick="location.reload()">Try Again</button>
            `;
          return; // Stop polling
        } else {
          // Still pending, continue polling
          setTimeout(() => pollPaymentStatus(transactionId), 5000); // Poll every 5 seconds
        }
      } else {
        // Error getting status
        paymentStatus.innerHTML = `
            <h3>Status Check Failed</h3>
            <p>${result.message || "Could not retrieve payment status."}</p>
            <button class="btn-primary" onclick="location.reload()">Start Over</button>
          `;
      }
    } catch (error) {
      console.error("Status check error:", error);
      paymentStatus.innerHTML = `
          <h3>Status Check Failed</h3>
          <p>An error occurred while checking payment status.</p>
          <button class="btn-primary" onclick="location.reload()">Start Over</button>
        `;
    }
  }
});

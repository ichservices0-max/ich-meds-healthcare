import React from "react";

export default function PayButton() {
  async function payNow() {
    try {
      const response = await fetch(
        "http://localhost:3000/api/payu/create-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: "10.00",
            productinfo: "ICH Meds Doctor Appointment",
            firstname: "Ishan",
            email: "test@example.com",
            phone: "9115161788",
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      // Create hidden form
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.paymentUrl;

      Object.entries(data.paymentData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("Payment error:", err);
      alert("An unexpected error occurred while processing the payment.");
    }
  }

  return (
    <button onClick={payNow}>
        Pay ₹ 10
    </button>
  );
}

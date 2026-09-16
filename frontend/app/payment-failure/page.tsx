"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const txnid = searchParams.get("txnid");

  return (
    <div className="flex min-h-screen items-center justify-center bg-red-100">
      <div className="rounded-lg bg-white p-8 shadow-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-800">Payment Failed</h1>
        {txnid && (
          <p className="mb-2 text-gray-700">
            Transaction ID: <span className="font-mono">{txnid}</span>
          </p>
        )}
        <p className="text-gray-600">Unfortunately, your payment could not be processed. Please try again or contact support.</p>
      </div>
    </div>
  );
}

export default function PaymentFailure() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage({ params }: { params: { appointmentId: string } }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payuFields, setPayuFields] = useState<any>(null);

  useEffect(() => {
    async function initPayment() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/payment/create-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ appointmentId: params.appointmentId })
        });
        
        const response = await res.json();
        
        if (res.ok && response.success && response.fields) {
          setPayuFields(response.fields);
        } else {
          setError(response.error || 'Failed to initialize payment.');
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Payment initialization error.');
        setLoading(false);
      }
    }
    
    initPayment();
  }, [params.appointmentId]);

  useEffect(() => {
    if (payuFields && formRef.current) {
      formRef.current.submit();
    }
  }, [payuFields]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50">
        <div className="rounded-lg bg-white p-8 shadow-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-800">Payment Error</h1>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
        <p className="text-gray-500">Please wait while we redirect you to the secure payment gateway.</p>
        
        {/* Hidden form to POST to PayU LIVE */}
        {payuFields && (
          <form 
            ref={formRef} 
            action="https://secure.payu.in/_payment" 
            method="POST" 
            className="hidden"
          >
            {Object.keys(payuFields).map((key) => (
              <input key={key} type="hidden" name={key} value={payuFields[key]} />
            ))}
          </form>
        )}
      </div>
    </div>
  );
}

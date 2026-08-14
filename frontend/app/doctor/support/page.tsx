'use client';

import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiMessageSquare, FiAlertCircle, FiHelpCircle, FiPhone, FiMail, FiSend } from 'react-icons/fi';

const FAQS = [
  { q: 'How do I get verified?', a: 'After registering, upload your Medical License, Registration Certificate, Degree Certificate, and Government ID. Our team will review your documents within 2–3 business days and notify you via email.' },
  { q: 'Why am I not appearing in patient search results?', a: 'Only verified doctors appear in patient searches. Please ensure you have uploaded all required documents and wait for our verification team to approve your account.' },
  { q: 'How do I accept or reject appointments?', a: 'Go to the Dashboard or Appointments page. Click the green checkmark to Accept and the red X to Reject any pending request.' },
  { q: 'Can I update my consultation fee?', a: 'Yes! Go to your Profile page, click "Edit Profile", update the Consultation Fee field, and click "Save Changes".' },
  { q: 'How is my rating calculated?', a: 'Your rating is the average of all star ratings left by patients after completed appointments. It updates automatically as new reviews come in.' },
  { q: 'How do I manage my availability?', a: 'Use the Availability Calendar page to view your scheduled slots, block off dates you are unavailable, and manage your appointment schedule.' },
  { q: 'How do I reset my password?', a: 'On the Doctor Login page, click "Forgot password?" and enter your registered email address. A reset link will be sent to your inbox.' },
];

export default function DoctorSupport() {
  const { doctor, loading } = useDoctorAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({ subject: '', message: '', type: 'GENERAL' });
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would POST to an API
    setTimeout(() => {
      setFeedbackSent(true);
      setFeedbackForm({ subject: '', message: '', type: 'GENERAL' });
    }, 500);
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Help & Support</h1>
        <p className="text-slate-500 mt-1">We're here to help you with anything you need.</p>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: FiPhone, title: 'Emergency Helpline', desc: 'For urgent medical system issues', value: '+91 1800-XXX-XXXX', color: 'text-red-600 bg-red-50' },
          { icon: FiMail, title: 'Email Support', desc: 'Get a response within 24 hours', value: 'support@ICH Meds.com', color: 'text-blue-600 bg-blue-50' },
          { icon: FiMessageSquare, title: 'Live Chat', desc: 'Mon–Sat, 9 AM – 6 PM', value: 'Start Chat →', color: 'text-teal-600 bg-teal-50' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon size={20} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{card.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{card.desc}</p>
            <p className="text-sm font-medium text-blue-600 mt-2">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FAQ Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center">
            <FiHelpCircle className="mr-2 text-blue-600" size={20} />
            <h2 className="font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-5 cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900 dark:text-white text-sm pr-4">{faq.q}</p>
                  {openFaq === i ? <FiChevronUp className="text-blue-600 flex-shrink-0" /> : <FiChevronDown className="text-slate-400 flex-shrink-0" />}
                </div>
                {openFaq === i && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {faq.a}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Report / Feedback Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center">
            <FiAlertCircle className="mr-2 text-blue-600" size={20} />
            <h2 className="font-bold text-slate-900 dark:text-white">Report an Issue</h2>
          </div>
          <div className="p-6">
            {feedbackSent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSend size={24} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Message Sent!</h3>
                <p className="text-sm text-slate-500 mt-1">Our team will get back to you within 24 hours.</p>
                <button onClick={() => setFeedbackSent(false)} className="mt-4 text-sm text-blue-600 hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                  <select value={feedbackForm.type} onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="GENERAL">General Query</option>
                    <option value="BUG">Bug Report</option>
                    <option value="BILLING">Billing Issue</option>
                    <option value="ACCOUNT">Account Problem</option>
                    <option value="VERIFICATION">Verification Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                  <input type="text" required value={feedbackForm.subject}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Brief description" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Message</label>
                  <textarea required rows={5} value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Describe your issue in detail..." />
                </div>
                <button type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-teal-600 transition-colors flex items-center justify-center space-x-2">
                  <FiSend size={15} />
                  <span>Submit Report</span>
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

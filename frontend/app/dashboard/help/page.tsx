'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, ExternalLink, Search } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

const FAQS: FAQ[] = [
  { id: 'f1', category: 'Appointments', question: 'How do I book an appointment with a doctor?', answer: 'Navigate to "Find Doctors" in the sidebar, search for the specialist you need using filters like specialty, city, or availability. Click "Book Appointment" on any doctor card, select your preferred date and time slot, add any notes, and confirm your booking. You\'ll receive a notification once the appointment is confirmed.' },
  { id: 'f2', category: 'Appointments', question: 'Can I cancel or reschedule an appointment?', answer: 'Yes! Go to "Appointments" in the sidebar, find the appointment you want to modify, and click the "Cancel" button. For rescheduling, cancel the current appointment and book a new one with your preferred time. Note that cancellations within 2 hours of the appointment may incur a fee.' },
  { id: 'f3', category: 'Video Consultations', question: 'How do video consultations work?', answer: 'When you book a video consultation, you\'ll receive a room link. At the scheduled time, go to "Appointments", find your upcoming appointment, and click "Join Video". You\'ll need to grant camera and microphone permissions. The consultation uses WebRTC technology for a secure, encrypted connection.' },
  { id: 'f4', category: 'Video Consultations', question: 'What do I need for a video consultation?', answer: 'You need a device with a camera and microphone (computer, tablet, or smartphone), a stable internet connection (at least 2 Mbps), and a modern browser (Chrome, Firefox, or Edge recommended). Make sure you\'re in a quiet, well-lit space.' },
  { id: 'f5', category: 'Medical Records', question: 'How do I upload my medical records?', answer: 'Go to "Medical Records" in the sidebar. Select the record type (Prescription, Lab Result, Imaging, or Other), then either click the upload area or drag and drop your file. Supported formats include PDF, JPG, PNG, and DOC files up to 20MB. Your records are encrypted and stored securely.' },
  { id: 'f6', category: 'Medical Records', question: 'Who can see my medical records?', answer: 'Your medical records are private and only accessible to you. When you have a video or chat consultation, you can choose to share specific records with your doctor during the session. We use bank-level encryption to protect your data.' },
  { id: 'f7', category: 'Account & Security', question: 'How do I change my password?', answer: 'Go to "Settings" in the sidebar and navigate to the "Security" tab. Enter your current password, then your new password twice to confirm. Make sure your new password is at least 8 characters with uppercase letters and numbers.' },
  { id: 'f8', category: 'Account & Security', question: 'Is my personal information secure?', answer: 'Absolutely. We use HIPAA-compliant encryption for all data storage and transmission. Your personal information is never shared with third parties without your explicit consent. We use industry-standard SSL/TLS encryption and regular security audits.' },
  { id: 'f9', category: 'Payments', question: 'What payment methods are accepted?', answer: 'We accept all major credit and debit cards (Visa, MasterCard, American Express), as well as digital wallets like Apple Pay and Google Pay. For some regions, we also support insurance billing directly through the platform.' },
]

const CATEGORIES = ['All', ...Array.from(new Set(FAQS.map((f) => f.category)))]

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = FAQS.filter((faq) => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = category === 'All' || faq.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
        <h1 className="text-4xl font-extrabold text-ink-800 mb-4 tracking-tight">How can we help?</h1>
        <p className="text-ink-500 text-lg mb-8 font-medium">Find answers to common questions about ICH Meds</p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for answers..."
            className="premium-input w-full pl-14 py-4 text-base shadow-sm"
          />
        </div>
      </motion.div>

      {/* Category filter */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2 flex-wrap justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all shadow-sm ${
              category === cat 
                ? 'bg-ink-700 border-ink-700 text-white' 
                : 'bg-white border-ink-200 text-ink-600 hover:text-ink-800 hover:bg-ink-50 hover:border-ink-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* FAQ accordion */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-4 max-w-3xl mx-auto">
        {filtered.length === 0 ? (
          <div className="premium-card p-12 text-center">
            <Search className="w-12 h-12 text-ink-300 mx-auto mb-4" />
            <p className="text-ink-700 font-bold text-lg mb-1">No results found for &quot;{searchQuery}&quot;</p>
            <p className="text-ink-500">Try checking for typos or searching with different keywords.</p>
          </div>
        ) : (
          filtered.map((faq, idx) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`premium-card overflow-hidden transition-all hover:border-ink-300 ${openFaq === faq.id ? 'border-primary-300 ring-4 ring-primary-50' : ''}`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none"
              >
                <div className="flex items-start gap-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md shrink-0 mt-0.5">
                    {faq.category}
                  </span>
                  <span className="font-bold text-ink-800 text-[15px] sm:text-base">{faq.question}</span>
                </div>
                <span className={`text-ink-400 ml-4 shrink-0 transition-transform duration-200 ${openFaq === faq.id ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-5 h-5" />
                </span>
              </button>
              <AnimatePresence>
                {openFaq === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 sm:px-6 pb-6 pt-2">
                      <p className="text-ink-600 text-[15px] leading-relaxed border-t border-ink-100 pt-4">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Contact support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="premium-card p-8 sm:p-10 text-center"
      >
        <h2 className="text-2xl font-extrabold text-ink-800 mb-2">Still need help?</h2>
        <p className="text-ink-500 font-medium mb-8">Our dedicated support team is available 24/7 to assist you.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: MessageCircle, label: 'Live Chat', desc: 'Chat with support', action: 'Start Chat', color: 'text-primary-600 bg-primary-50 border-primary-100', hover: 'hover:border-primary-300' },
            { icon: Phone, label: 'Phone Support', desc: '+1 (800) 555-0123', action: 'Call Now', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', hover: 'hover:border-emerald-300' },
            { icon: Mail, label: 'Email Support', desc: 'support@ICH Meds.com', action: 'Send Email', color: 'text-accent-600 bg-accent-50 border-accent-100', hover: 'hover:border-accent-300' },
          ].map(({ icon: Icon, label, desc, action, color, hover }) => (
            <div key={label} className={`bg-white border border-ink-100 rounded-2xl p-6 text-center cursor-pointer transition-all shadow-sm group ${hover}`}>
              <div className={`w-14 h-14 border ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="font-bold text-ink-800">{label}</p>
              <p className="text-sm font-medium text-ink-500 mt-1 mb-4">{desc}</p>
              <button className="text-sm text-ink-700 font-bold flex items-center gap-1.5 mx-auto group-hover:text-primary-600 transition-colors">
                {action} <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

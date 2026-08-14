'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import ChatBox from './ChatBox';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  currentUser: { id: string; role: 'patient' | 'doctor' };
  apiToken: string;
}

export default function ChatModal({ isOpen, onClose, appointmentId, patientName, currentUser, apiToken }: ChatModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col h-[600px] max-h-[85vh] overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Chat with {patientName}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden p-0 bg-slate-50 dark:bg-slate-900">
              <ChatBox 
                appointmentId={appointmentId} 
                currentUser={currentUser} 
                apiToken={apiToken} 
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

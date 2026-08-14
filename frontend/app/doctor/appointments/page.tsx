'use client';

import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheck, FiX, FiCheckCircle, FiFileText, FiFolder } from 'react-icons/fi';
import PrescriptionDigitizerModal from '@/components/PrescriptionDigitizerModal';
import PatientFilesModal from '@/components/PatientFilesModal';
import ChatModal from '@/components/ChatModal';
import PreCheckViewModal from '@/components/PreCheckViewModal';
import { FiMessageSquare, FiClipboard } from 'react-icons/fi';

export default function DoctorAppointments() {
  const { doctor, loading } = useDoctorAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  
  // Prescription Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<{ id: string, patientName: string } | null>(null);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [selectedPatientFiles, setSelectedPatientFiles] = useState<{ id: string, name: string } | null>(null);
  
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{ id: string, patientName: string } | null>(null);

  const [isPreCheckModalOpen, setIsPreCheckModalOpen] = useState(false);
  const [selectedPreCheckApptId, setSelectedPreCheckApptId] = useState<string | null>(null);

  useEffect(() => {
    if (doctor) fetchAppointments();
  }, [doctor]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(res.data);
    } catch (error) {
      console.error('Failed to fetch appointments', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('doctorToken');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/appointments/${id}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appointments</h1>
        <div className="flex space-x-2">
          {['ALL', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Session & Token</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filtered.map(apt => (
              <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-3">
                      {apt.patient?.name?.[0]}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{apt.patient?.name}</div>
                      <div className="text-sm text-slate-500">{apt.patient?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                  Token #{apt.tokenNumber} — {apt.session?.sessionType} ({apt.session?.startTime} - {apt.session?.endTime})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${apt.status === 'WAITING' ? 'bg-amber-100 text-amber-800' : 
                      apt.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' : 
                      apt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 
                      'bg-slate-100 text-slate-800'}`}>
                    {apt.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {apt.status === 'WAITING' && (
                      <>
                        <button
                          onClick={() => updateStatus(apt.id, 'IN_PROGRESS')}
                          className="flex items-center space-x-1 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition-colors"
                        >
                          <FiCheck /> <span>Start</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPreCheckApptId(apt.id);
                            setIsPreCheckModalOpen(true);
                          }}
                          className="flex items-center space-x-1 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 transition-colors"
                        >
                          <FiClipboard /> <span>Pre-Check</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedChat({ id: apt.id, patientName: apt.patient?.name || 'Patient' });
                            setIsChatModalOpen(true);
                          }}
                          className="flex items-center space-x-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                        >
                          <FiMessageSquare /> <span>Chat</span>
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, 'CANCELLED')}
                          className="flex items-center space-x-1 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-100 transition-colors"
                        >
                          <FiX /> <span>Cancel</span>
                        </button>
                      </>
                    )}
                    
                    {apt.status === 'IN_PROGRESS' && (
                      <>
                        <button
                          onClick={() => updateStatus(apt.id, 'COMPLETED')}
                          className="flex items-center space-x-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                        >
                          <FiCheckCircle /> <span>Complete</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPreCheckApptId(apt.id);
                            setIsPreCheckModalOpen(true);
                          }}
                          className="flex items-center space-x-1 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 transition-colors"
                        >
                          <FiClipboard /> <span>Pre-Check</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedChat({ id: apt.id, patientName: apt.patient?.name || 'Patient' });
                            setIsChatModalOpen(true);
                          }}
                          className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                        >
                          <FiMessageSquare /> <span>Chat</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAppt({ id: apt.id, patientName: apt.patient.name });
                            setIsModalOpen(true);
                          }}
                          className="flex items-center space-x-1 bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg font-bold hover:bg-teal-100 transition-colors"
                        >
                          <FiFileText /> <span>AI Rx</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatientFiles({ id: apt.patientId || apt.patient._id || apt.patient.id, name: apt.patient.name });
                            setIsFilesModalOpen(true);
                          }}
                          className="flex items-center space-x-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-100 transition-colors"
                        >
                          <FiFolder /> <span>Files</span>
                        </button>
                      </>
                    )}

                    {apt.status === 'COMPLETED' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedAppt({ id: apt.id, patientName: apt.patient.name });
                            setIsModalOpen(true);
                          }}
                          className="flex items-center space-x-1 bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg font-bold hover:bg-teal-100 transition-colors"
                        >
                          <FiFileText /> <span>Update Rx</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatientFiles({ id: apt.patientId || apt.patient._id || apt.patient.id, name: apt.patient.name });
                            setIsFilesModalOpen(true);
                          }}
                          className="flex items-center space-x-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-100 transition-colors"
                        >
                          <FiFolder /> <span>Files</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No appointments found.
          </div>
        )}
      </div>

      {selectedAppt && (
        <PrescriptionDigitizerModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppt(null);
          }}
          appointmentId={selectedAppt.id}
          patientName={selectedAppt.patientName}
        />
      )}

      {selectedPatientFiles && (
        <PatientFilesModal 
          isOpen={isFilesModalOpen}
          onClose={() => {
            setIsFilesModalOpen(false);
            setSelectedPatientFiles(null);
          }}
          patientId={selectedPatientFiles.id}
          patientName={selectedPatientFiles.name}
        />
      )}
      {selectedChat && doctor && (
        <ChatModal 
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setSelectedChat(null);
          }}
          appointmentId={selectedChat.id}
          patientName={selectedChat.patientName}
          currentUser={{ id: doctor.id, role: 'doctor' }}
          apiToken={typeof window !== 'undefined' ? localStorage.getItem('doctorToken') || '' : ''}
        />
      )}

      {selectedPreCheckApptId && (
        <PreCheckViewModal
          isOpen={isPreCheckModalOpen}
          onClose={() => {
            setIsPreCheckModalOpen(false);
            setSelectedPreCheckApptId(null);
          }}
          appointmentId={selectedPreCheckApptId}
        />
      )}
    </div>
  );
}

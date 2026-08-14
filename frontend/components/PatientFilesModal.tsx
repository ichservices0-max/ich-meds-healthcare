'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiX, FiFileText, FiTrash2, FiFile, FiImage, FiActivity, FiDownload } from 'react-icons/fi';
import axios from 'axios';
import { useDoctorAuth } from '@/contexts/DoctorAuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

interface MedicalRecord {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  doctorId?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getIconForType(type: string) {
  switch (type) {
    case 'prescription': return <FiFileText className="w-5 h-5 text-primary-600" />;
    case 'imaging': return <FiImage className="w-5 h-5 text-accent-600" />;
    case 'lab-result': return <FiActivity className="w-5 h-5 text-emerald-600" />;
    default: return <FiFile className="w-5 h-5 text-slate-600" />;
  }
}

export default function PatientFilesModal({ isOpen, onClose, patientId, patientName }: Props) {
  const { doctor } = useDoctorAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState('lab-result');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchRecords();
    }
  }, [isOpen, patientId]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('doctorToken');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/patients/${patientId}/records`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data.data);
    } catch (error) {
      console.error('Failed to fetch patient records', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const token = localStorage.getItem('doctorToken');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/patients/${patientId}/records`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      
      setRecords(prev => [res.data.data, ...prev]);
    } catch (error: any) {
      console.error('Upload failed', error);
      alert(error.response?.data?.error || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const token = localStorage.getItem('doctorToken');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/patients/${patientId}/records/${recordId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(prev => prev.filter(r => r.id !== recordId));
    } catch (error: any) {
      console.error('Delete failed', error);
      alert(error.response?.data?.error || 'Failed to delete file.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-surface-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Patient Records</h2>
            <p className="text-sm text-ink-500">Shared Files for {patientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <FiX className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          {/* Upload Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-ink-700 mb-4">Upload New Record</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <select 
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full sm:w-auto p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="lab-result">Lab Result</option>
                <option value="imaging">Imaging (X-Ray, MRI)</option>
                <option value="prescription">Prescription</option>
                <option value="other">Other Document</option>
              </select>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isUploading ? <FiUploadCloud className="w-5 h-5 animate-pulse" /> : <FiUploadCloud className="w-5 h-5" />}
                {isUploading ? 'Uploading...' : 'Select File'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
                accept="application/pdf,image/jpeg,image/png,image/jpg"
                className="hidden" 
              />
            </div>
            <p className="text-xs text-ink-400 mt-3">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
          </div>

          {/* Records List */}
          <div>
            <h3 className="text-sm font-bold text-ink-700 mb-4">Existing Records</h3>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 border-dashed">
                <FiFileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">No records found for this patient.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {records.map(record => {
                  const isUploader = record.doctorId === doctor?.id;
                  const isPatientUploaded = !record.doctorId;
                  
                  return (
                    <div key={record.id} className="flex items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                        {getIconForType(record.type)}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h4 className="font-bold text-ink-800 truncate">{record.fileName}</h4>
                        <div className="flex items-center gap-3 text-xs text-ink-500 mt-1">
                          <span className="capitalize font-medium">{record.type.replace('-', ' ')}</span>
                          <span>&bull;</span>
                          <span>{formatBytes(record.fileSize)}</span>
                          <span>&bull;</span>
                          <span>{new Date(record.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 text-xs font-semibold">
                          {isUploader ? (
                            <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Uploaded by You</span>
                          ) : isPatientUploaded ? (
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Uploaded by Patient</span>
                          ) : (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Uploaded by Another Doctor</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <a 
                          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${record.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Download/View"
                        >
                          <FiDownload className="w-5 h-5" />
                        </a>
                        {isUploader && (
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

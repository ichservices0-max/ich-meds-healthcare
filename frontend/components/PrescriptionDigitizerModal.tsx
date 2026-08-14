'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiX, FiCheck, FiRefreshCw, FiImage } from 'react-icons/fi';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
}

export default function PrescriptionDigitizerModal({ isOpen, onClose, appointmentId, patientName }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setSaved(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped);
      setPreviewUrl(URL.createObjectURL(dropped));
      setSaved(false);
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('doctorToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/appointments/${appointmentId}/prescription/upload`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      setSaved(true);
      setTimeout(() => {
        onClose();
        reset();
      }, 1500);
    } catch (error) {
      console.error('Failed to upload prescription image', error);
      alert('Failed to upload. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upload Prescription</h2>
            <p className="text-sm text-slate-500 mt-0.5">Patient: <span className="font-semibold text-slate-700">{patientName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <FiX className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-5">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            className={`relative w-full rounded-2xl border-2 border-dashed transition-all ${
              previewUrl
                ? 'border-primary-300 bg-white cursor-default'
                : 'border-slate-300 bg-white hover:border-primary-400 hover:bg-primary-50 cursor-pointer'
            }`}
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className="w-full max-h-[350px] object-contain rounded-2xl"
                />
                {/* Re-upload overlay button */}
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow border border-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <FiImage className="w-3.5 h-3.5" /> Change
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                  <FiUploadCloud className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Drag & drop or click to upload
                </h3>
                <p className="text-sm text-slate-500">
                  Upload a photo or scan of the prescription
                </p>
                <p className="text-xs font-semibold text-primary-600 mt-4 bg-primary-50 px-3 py-1 rounded-full">
                  JPG, PNG, WEBP — Max 10MB
                </p>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          {/* File info */}
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm"
            >
              <FiImage className="w-4 h-4 text-primary-500 shrink-0" />
              <span className="text-slate-700 font-medium truncate">{file.name}</span>
              <span className="text-slate-400 shrink-0 ml-auto">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!file || isSaving || saved}
            className={`flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              saved
                ? 'bg-emerald-500 shadow-emerald-500/30'
                : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'
            }`}
          >
            {saved ? (
              <><FiCheck className="w-5 h-5" /> Saved!</>
            ) : isSaving ? (
              <><FiRefreshCw className="w-5 h-5 animate-spin" /> Uploading...</>
            ) : (
              <><FiUploadCloud className="w-5 h-5" /> Save to Patient Records</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, FlaskConical, Scan, MoreHorizontal, Eye, Trash2, File, ImageIcon, X, Plus,
} from 'lucide-react'
import { recordsApi } from '@/lib/api'
import type { MedicalRecord } from '@/lib/api'

type RecordType = 'prescription' | 'lab-result' | 'imaging' | 'other'

const TYPE_OPTIONS: { value: RecordType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'prescription', label: 'Prescription', icon: FileText, color: 'text-primary-600 bg-primary-50 border border-primary-100' },
  { value: 'lab-result', label: 'Lab Result', icon: FlaskConical, color: 'text-emerald-600 bg-emerald-50 border border-emerald-100' },
  { value: 'imaging', label: 'Imaging', icon: Scan, color: 'text-accent-600 bg-accent-50 border border-accent-100' },
  { value: 'other', label: 'Other', icon: File, color: 'text-ink-600 bg-ink-50 border border-ink-200' },
]

const MOCK_RECORDS: MedicalRecord[] = [
  { _id: 'r1', name: 'Blood Test Results - June 2026', type: 'lab-result', url: '#', size: 245000, uploadedAt: '2026-06-15T10:30:00Z', mimeType: 'application/pdf' },
  { _id: 'r2', name: 'Prescription - Dr. Mitchell', type: 'prescription', url: '#', size: 89000, uploadedAt: '2026-06-10T14:00:00Z', mimeType: 'application/pdf' },
  { _id: 'r3', name: 'Chest X-Ray', type: 'imaging', url: '#', size: 3200000, uploadedAt: '2026-05-28T09:00:00Z', mimeType: 'image/jpeg' },
  { _id: 'r4', name: 'MRI Brain Scan Report', type: 'imaging', url: '#', size: 8500000, uploadedAt: '2026-05-15T11:00:00Z', mimeType: 'application/pdf' },
  { _id: 'r5', name: 'Annual Health Checkup Report', type: 'other', url: '#', size: 560000, uploadedAt: '2026-04-01T08:00:00Z', mimeType: 'application/pdf' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>(MOCK_RECORDS)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadType, setUploadType] = useState<RecordType>('prescription')
  const [isUploading, setIsUploading] = useState(false)
  const [filterType, setFilterType] = useState<RecordType | 'all'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsLoading(true)
    recordsApi.getAll()
      .then((res) => setRecords(res.data.data))
      .catch(() => setRecords(MOCK_RECORDS))
      .finally(() => setIsLoading(false))
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) handleUpload(files[0])
  }

  async function handleUpload(file: File) {
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', uploadType)
    try {
      const res = await recordsApi.upload(formData)
      setRecords((prev) => [res.data.data, ...prev])
    } catch {
      // Add mock record for demo
      const newRecord: MedicalRecord = {
        _id: `r-${Date.now()}`,
        name: file.name,
        type: uploadType,
        url: URL.createObjectURL(file),
        size: file.size,
        uploadedAt: new Date().toISOString(),
        mimeType: file.type,
      }
      setRecords((prev) => [newRecord, ...prev])
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleteConfirm(null)
    const record = records.find(r => r._id === id || r.id === id)
    if (record?.doctorId) {
      alert('You cannot delete a record uploaded by a doctor.')
      return
    }

    try {
      await recordsApi.delete(id)
    } catch { /* demo */ }
    setRecords((prev) => prev.filter((r) => r._id !== id && r.id !== id))
  }

  const filtered = filterType === 'all' ? records : records.filter((r) => r.type === filterType)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title text-2xl">Medical Records Vault</h1>
        <p className="section-subtitle">Securely store and manage your health documents</p>
      </motion.div>

      {/* Upload section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="premium-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <h2 className="text-lg font-bold text-ink-700">Upload Document</h2>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setUploadType(value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  uploadType === value
                    ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm'
                    : 'bg-white border-ink-200 text-ink-500 hover:text-ink-700 hover:border-ink-300 hover:bg-ink-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone bg-ink-50 hover:bg-primary-50/50 ${isDragging ? 'border-primary-400 bg-primary-50' : 'border-ink-200'} ${isUploading ? 'animate-pulse' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-white border border-ink-100 shadow-sm rounded-2xl flex items-center justify-center mb-2">
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-7 h-7 text-primary-500" />
              )}
            </div>
            <div>
              <p className="text-ink-700 font-bold text-lg">{isUploading ? 'Uploading...' : 'Drop file here or click to browse'}</p>
              <p className="text-ink-400 text-sm mt-1">Supported: PDF, JPG, PNG, DOC (Max 20MB)</p>
            </div>
            {!isUploading && (
              <button className="btn-secondary text-sm px-6 py-2.5 mt-2 bg-white font-bold shadow-sm">
                <Plus className="w-4 h-4 inline mr-1" /> Choose File
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              filterType === 'all' 
                ? 'bg-ink-700 border-ink-700 text-white shadow-sm' 
                : 'bg-white border-ink-200 text-ink-600 hover:text-ink-800 hover:bg-ink-50 hover:border-ink-300'
            }`}
          >
            All ({records.length})
          </button>
          {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilterType(value)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                filterType === value 
                  ? 'bg-ink-700 border-ink-700 text-white shadow-sm' 
                  : 'bg-white border-ink-200 text-ink-600 hover:text-ink-800 hover:bg-ink-50 hover:border-ink-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {label} ({records.filter((r) => r.type === value).length})
            </button>
          ))}
        </div>

        {/* Records grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid sm:grid-cols-2 gap-4"
        >
          <AnimatePresence>
            {filtered.map((record, idx) => {
              const typeInfo = TYPE_OPTIONS.find((t) => t.value === record.type) || TYPE_OPTIONS[3]
              const Icon = record.mimeType?.startsWith('image/') ? ImageIcon : typeInfo.icon
              const rId = record.id || record._id
              const rName = record.fileName || record.name
              const rSize = record.fileSize || record.size || 0
              const rDate = record.createdAt || record.uploadedAt || new Date().toISOString()
              const rUrl = record.fileUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${record.fileUrl}` : record.url

              return (
                <motion.div
                  key={rId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className="premium-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-primary-200 hover:shadow-card-hover transition-all relative overflow-hidden"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <p className="font-bold text-ink-700 text-[15px] truncate mb-1">{rName}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-1">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-xs font-medium text-ink-400 flex items-center gap-1 before:content-[''] before:w-1 before:h-1 before:bg-ink-300 before:rounded-full">
                        {formatBytes(rSize)}
                      </span>
                      <span className="text-xs font-medium text-ink-400 flex items-center gap-1 before:content-[''] before:w-1 before:h-1 before:bg-ink-300 before:rounded-full">
                        {formatDate(rDate)}
                      </span>
                      {record.doctorId && (
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md flex items-center gap-1 before:content-[''] before:w-1 before:h-1 before:bg-ink-300 before:rounded-full">
                          Uploaded by Doctor
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 sm:self-center self-end mt-2 sm:mt-0">
                    <a
                      href={rUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-white border border-ink-100 hover:bg-primary-50 hover:border-primary-100 hover:text-primary-600 rounded-xl flex items-center justify-center text-ink-400 transition-all shadow-sm"
                      title="View Document"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </a>
                    {!record.doctorId && (
                      <button
                        onClick={() => setDeleteConfirm(rId as string)}
                        className="w-9 h-9 bg-white border border-ink-100 hover:bg-red-50 hover:border-red-100 hover:text-red-600 rounded-xl flex items-center justify-center text-ink-400 transition-all shadow-sm"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && !isLoading && (
          <div className="premium-card p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-ink-50 rounded-2xl flex items-center justify-center mb-4 border border-ink-100">
              <FileText className="w-8 h-8 text-ink-300" />
            </div>
            <p className="text-ink-700 font-bold text-lg">No records found</p>
            <p className="text-ink-400 text-sm mt-1">Upload your first medical document above to get started.</p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="premium-card p-6 sm:p-8 max-w-sm w-full shadow-elevated"
            >
              <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-ink-800 text-center mb-2">Delete Record?</h3>
              <p className="text-ink-500 text-sm text-center mb-8">This action cannot be undone. Are you sure you want to permanently delete this file?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="btn-secondary flex-1 bg-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm)} 
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

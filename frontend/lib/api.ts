import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getToken, removeToken } from './auth'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ===== Request interceptor: attach Bearer token =====
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// ===== Response interceptor: handle auth errors =====
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ===== Typed API helpers =====

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
}

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: Record<string, unknown> }>>('/auth/login', { email, password }),

  register: (data: { name: string; email: string; mobile: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: Record<string, unknown> }>>('/auth/register', {
      name: data.name,
      email: data.email,
      phone: data.mobile,
      password: data.password,
    }),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ resetToken: string; message: string }>>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, password }),

  payMembership: () => api.patch<ApiResponse<{ message: string }>>('/auth/pay-membership'),

  getProfile: () =>
    api.get<ApiResponse<Record<string, unknown>>>('/auth/profile'),

  updateProfile: (data: Record<string, unknown>) =>
    api.put<ApiResponse<Record<string, unknown>>>('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/change-password', { currentPassword, newPassword }),
}

// Doctor endpoints
export const doctorsApi = {
  getAll: (params?: { specialty?: string; city?: string; radius?: number; lat?: number; lng?: number }) =>
    api.get<PaginatedResponse<Doctor>>('/doctors/search', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Doctor>>(`/doctors/${id}`),

  getAvailableSessions: (doctorId: string, date: string) =>
    api.get<ApiResponse<DoctorSession[]>>(`/doctors/${doctorId}/sessions`, { params: { date } }),
}

// Appointment endpoints
export const appointmentsApi = {
  getAll: (status?: string) =>
    api.get<ApiResponse<Appointment[]>>('/appointments', { params: { status } }),

  create: (data: CreateAppointmentDto) =>
    api.post<ApiResponse<Appointment>>('/appointments', data),

  cancel: (id: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/cancel`),

  getById: (id: string) =>
    api.get<ApiResponse<Appointment>>(`/appointments/${id}`),
}

// Medical records endpoints
export const recordsApi = {
  getAll: () =>
    api.get<ApiResponse<MedicalRecord[]>>('/records'),

  upload: (formData: FormData) =>
    api.post<ApiResponse<MedicalRecord>>('/records/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/records/${id}`),
}

// Notifications endpoints
export const notificationsApi = {
  getAll: () =>
    api.get<ApiResponse<Notification[]>>('/notifications'),

  markRead: (id: string) =>
    api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<ApiResponse<{ message: string }>>('/notifications/read-all'),
}

// ===== Type definitions =====

export interface Doctor {
  _id?: string
  id?: string
  name: string
  specialty: string
  city: string
  avatar?: string
  rating?: number
  reviewCount?: number
  consultationFee?: number // from search
  fee?: number // from db
  experience?: number
  bio?: string
  imageUrl?: string
  profileImage?: string // from search
  languagesSpoken?: string[]
  verificationStatus?: string
  membershipStatus?: string
  isOnline?: boolean
}

export interface DoctorSession {
  id: string
  sessionType: 'MORNING' | 'EVENING'
  startTime: string
  endTime: string
  maxTokens: number
  bookedTokens: number
  currentToken: number
  isAvailable: boolean
  date: string
}

export interface Appointment {
  _id: string
  id?: string
  doctor: Doctor
  session: DoctorSession
  patient: { name: string; email: string }
  tokenNumber: number
  date: string
  time: string
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  type: 'in-person' | 'video'
  roomId?: string
}

export interface CreateAppointmentDto {
  doctorId: string
  sessionId: string
  notes?: string
  type: 'in-person' | 'video'
}

export interface MedicalRecord {
  _id?: string
  id?: string
  name?: string
  fileName?: string
  type: 'prescription' | 'lab-result' | 'imaging' | 'other'
  url?: string
  fileUrl?: string
  size?: number
  fileSize?: number
  uploadedAt?: string
  createdAt?: string
  mimeType?: string
  doctorId?: string
}

export interface Notification {
  _id: string
  title: string
  message: string
  type: 'appointment' | 'message' | 'reminder' | 'system'
  isRead: boolean
  createdAt: string
  link?: string
}

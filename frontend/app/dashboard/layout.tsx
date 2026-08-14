'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Users, Calendar, FileText, Bell, HelpCircle, Settings,
  Menu, X, Search, LogOut, ChevronDown, User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { notificationsApi } from '@/lib/api'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/doctors', label: 'Find Doctors', icon: Users },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/records', label: 'Medical Records', icon: FileText },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/help', label: 'Help Center', icon: HelpCircle },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { patient, isLoading, isAuthenticated, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch unread notification count
  useEffect(() => {
    if (isAuthenticated) {
      notificationsApi.getAll()
        .then((res) => {
          const unread = res.data.data.filter((n) => !n.isRead).length
          setUnreadCount(unread)
        })
        .catch(() => setUnreadCount(3)) // fallback demo count
    }
  }, [isAuthenticated, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-gradient-hero rounded-2xl flex items-center justify-center animate-pulse shadow-glow-indigo">
            <span className="text-white font-black text-lg tracking-tight">ICH</span>
          </div>
          <p className="text-ink-400 text-sm font-medium animate-pulse">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const userName = patient?.name || 'Patient'
  const userEmail = patient?.email || ''
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4F46E5&color=ffffff&bold=true&size=128`

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* ===== Sidebar ===== */}
      <AnimatePresence>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          w-[260px] bg-white border-r border-ink-100 shadow-soft
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-ink-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-black text-sm tracking-tighter">ICH</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-black text-ink-800 tracking-tight">ICH Meds</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-ink-400 hover:text-ink-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-ink-300 uppercase tracking-wider mb-2">Main Menu</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all font-medium ${
                  active 
                    ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100/50' 
                    : 'text-ink-500 hover:text-ink-700 hover:bg-ink-50'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary-600' : 'text-ink-400'}`} />
                <span>{label}</span>
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section at bottom */}
        <div className="px-4 py-4 border-t border-ink-100 bg-surface-50/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl">
            <img
              src={avatarUrl}
              alt={userName}
              className="w-10 h-10 rounded-full border border-ink-200 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-700 truncate">{userName}</p>
              <p className="text-xs text-ink-400 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ===== Main content area ===== */}
      <div className="flex-1 flex flex-col lg:pl-[260px] min-h-screen">
        {/* ===== Top header ===== */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-ink-100 px-4 lg:px-8 h-[72px] flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-ink-500 hover:text-ink-700 p-2 rounded-lg hover:bg-ink-50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctors, appointments, records..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-50 border-none text-sm text-ink-700 placeholder:text-ink-400 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all shadow-inner-soft"
            />
          </div>

          <div className="ml-auto flex items-center gap-3 lg:gap-4">
            {/* Notifications */}
            <Link
              href="/dashboard/notifications"
              className="relative w-10 h-10 rounded-xl bg-white hover:bg-ink-50 border border-ink-100 flex items-center justify-center text-ink-500 hover:text-ink-700 transition-all shadow-sm"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </Link>

            <div className="w-px h-8 bg-ink-200 hidden sm:block" />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-ink-50 border border-transparent hover:border-ink-100 transition-all"
              >
                <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full border border-ink-200" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-ink-700 max-w-[120px] truncate leading-tight">
                    {userName}
                  </p>
                  <p className="text-[11px] text-ink-400 leading-tight">Patient</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-56 premium-card p-1.5 shadow-elevated"
                  >
                    <div className="px-3 py-2.5 mb-1 border-b border-ink-100 sm:hidden">
                      <p className="text-sm font-semibold text-ink-700 truncate">{userName}</p>
                      <p className="text-[11px] text-ink-400">{userEmail}</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-600 hover:text-ink-800 hover:bg-ink-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-ink-400" /> Profile Settings
                    </Link>
                    <div className="my-1 border-t border-ink-100" />
                    <button
                      onClick={() => { setUserMenuOpen(false); logout() }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

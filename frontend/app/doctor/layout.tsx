'use client';

import { DoctorAuthProvider, useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

function DoctorHeader({ pathname }: { pathname: string }) {
  const { doctor, logout } = useDoctorAuth();
  
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="glass-card h-16 flex items-center justify-between px-6 rounded-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-glow-indigo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight gradient-text">
              ICH Pro
            </span>
            <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold bg-primary-50 text-primary-600 uppercase tracking-wider hidden sm:block">
              Doctor
            </span>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-2">
            {[
              { name: 'Overview', path: '/doctor' },
              { name: 'Live Queue', path: '/doctor/queue' },
              { name: 'Appointments', path: '/doctor/appointments' },
              { name: 'Calendar', path: '/doctor/calendar' },
              { name: 'Reviews', path: '/doctor/reviews' },
              { name: 'Notifications', path: '/doctor/notifications' },
              { name: 'Profile', path: '/doctor/profile' },
              { name: 'Support', path: '/doctor/support' },
            ].map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={pathname === link.path ? 'nav-link-active' : 'nav-link'}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <button onClick={logout} className="btn-ghost px-3 py-1.5 text-[13px] hidden sm:block">Logout</button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-electric to-primary flex items-center justify-center text-white font-bold text-sm shadow-sm border-2 border-white cursor-pointer hover:scale-105 transition-transform overflow-hidden">
              {doctor?.imageUrl ? (
                <img src={doctor.imageUrl.startsWith('http') ? doctor.imageUrl : `http://localhost:5000${doctor.imageUrl}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                doctor?.name?.[0] || 'D'
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/doctor/login' || pathname === '/doctor/register';

  return (
    <DoctorAuthProvider>
      <div className="min-h-screen bg-surface-50 text-ink flex flex-col relative z-0">
        {!isAuthPage && <DoctorHeader pathname={pathname} />}
        
        <main className={`flex-grow ${isAuthPage ? '' : 'px-6 lg:px-10 py-8 max-w-7xl mx-auto w-full'}`}>
          {children}
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', fontWeight: '600', fontSize: '14px' },
        }}
      />
    </DoctorAuthProvider>
  );
}

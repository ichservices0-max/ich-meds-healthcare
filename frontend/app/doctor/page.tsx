'use client';

import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { motion } from 'framer-motion';
import { FiUsers, FiCalendar, FiDollarSign, FiStar, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DoctorDashboard() {
  const { doctor, loading } = useDoctorAuth();
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (doctor) fetchDashboardData();
  }, [doctor]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://ich-meds-healthcare-production.up.railway.app'}/api/doctor/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setAppointments(data);
      
      const pending = data.filter((a: any) => a.status === 'PENDING');
      const confirmed = data.filter((a: any) => a.status === 'WAITING' || a.status === 'IN_PROGRESS');
      const completed = data.filter((a: any) => a.status === 'COMPLETED');
      
      setStats({
        totalPatients: new Set(completed.map((a: any) => a.patientId)).size,
        upcoming: confirmed.length,
        earnings: completed.length * (doctor?.fee || 0),
        rating: doctor?.rating || 0,
        requests: pending,
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('doctorToken');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/appointments/${id}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  if (loading || isLoading) return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Verification Banner */}
      {doctor?.verificationStatus === 'PENDING' && (
        <div className="premium-card-static bg-gold-50/50 border-l-4 border-l-gold-500 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center shrink-0">
            <FiClock size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gold-700">Account Pending Verification</h3>
            <p className="text-[14px] text-gold-600/80 mt-0.5 leading-relaxed">Our team is reviewing your uploaded documents. You will not appear in patient searches until verified.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-700 tracking-tight">Welcome back, {doctor?.name}</h1>
          <p className="text-[15px] text-ink-400 mt-1">Here's what's happening with your practice today.</p>
        </div>
        <div>
          <span className={doctor?.verificationStatus === 'VERIFIED' ? 'badge-success' : 'badge-warning'}>
            {doctor?.verificationStatus}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Patients', value: stats?.totalPatients || 0, icon: FiUsers, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Upcoming Appts', value: stats?.upcoming || 0, icon: FiCalendar, color: 'text-electric-600', bg: 'bg-electric-50' },
          { label: 'Total Earnings', value: `₹${stats?.earnings || 0}`, icon: FiDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Overall Rating', value: stats?.rating || 0, icon: FiStar, color: 'text-gold-600', bg: 'bg-gold-50' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} 
            className="stat-card group">
            <div className={`stat-icon ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-ink-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-extrabold text-ink-700">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointment Requests */}
        <div className="lg:col-span-2">
          <div className="premium-card-static overflow-hidden">
            <div className="p-6 border-b border-black/[0.04] flex justify-between items-center bg-surface-50/50">
              <h2 className="section-title mb-0">Appointment Requests</h2>
              <span className="badge-primary px-3 py-1.5">{stats?.requests?.length || 0} New</span>
            </div>
            <div className="divide-y divide-black/[0.04]">
              {stats?.requests?.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-ink-300">
                    <FiCheck size={28} />
                  </div>
                  <p className="text-[15px] font-medium text-ink-500">No pending requests</p>
                  <p className="text-[13px] text-ink-400 mt-1">You're all caught up!</p>
                </div>
              ) : (
                stats?.requests?.map((req: any) => (
                  <div key={req.id} className="p-6 flex items-center justify-between hover:bg-surface-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-lg font-bold text-white shadow-soft">
                        {req.patient?.name?.[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-ink-700">{req.patient?.name}</h4>
                        <p className="text-[13px] text-ink-500 font-medium mt-0.5">Token #{req.tokenNumber} — {req.session?.sessionType} ({req.session?.startTime} - {req.session?.endTime})</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={() => updateAppointmentStatus(req.id, 'REJECTED')} className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors active:scale-95" title="Reject">
                        <FiX size={20} />
                      </button>
                      <button onClick={() => updateAppointmentStatus(req.id, 'WAITING')} className="w-10 h-10 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors active:scale-95" title="Accept">
                        <FiCheck size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Today */}
        <div>
          <div className="premium-card-static overflow-hidden h-full">
            <div className="p-6 border-b border-black/[0.04] bg-surface-50/50">
              <h2 className="section-title mb-0">Upcoming Today</h2>
            </div>
            <div className="p-6 space-y-4">
              {appointments.filter(a => a.status === 'WAITING' || a.status === 'IN_PROGRESS').slice(0, 4).map((apt: any) => (
                <div key={apt.id} className="flex p-4 rounded-xl border border-black/[0.04] bg-surface-50/50 hover:bg-surface-100 transition-colors relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-1.5 transition-all" />
                  <div className="flex-1 ml-2">
                    <h4 className="font-bold text-[14px] text-ink-700">{apt.patient?.name}</h4>
                    <p className="text-[12px] font-medium text-ink-500 mt-1">Token #{apt.tokenNumber} — {apt.session?.sessionType} ({apt.session?.startTime} - {apt.session?.endTime})</p>
                  </div>
                </div>
              ))}
              {appointments.filter(a => a.status === 'WAITING' || a.status === 'IN_PROGRESS').length === 0 && (
                <p className="text-[14px] text-ink-400 text-center py-6">No upcoming appointments today.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  specialty: string;
  verificationStatus: string;
  membershipStatus: string;
  imageUrl?: string;
  [key: string]: any;
}

interface DoctorAuthContextType {
  doctor: Doctor | null;
  loading: boolean;
  login: (token: string, doctorData: Doctor) => void;
  logout: () => void;
  updateDoctorInfo: (data: Partial<Doctor>) => void;
}

const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);

export const DoctorAuthProvider = ({ children }: { children: ReactNode }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('doctorToken');
      if (token) {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://ich-meds-healthcare-production.up.railway.app'}/api/doctor/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDoctor(res.data.doctor);
        } catch (error) {
          console.error('Doctor auth failed:', error);
          localStorage.removeItem('doctorToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!doctor && pathname.startsWith('/doctor') && !pathname.includes('/doctor/login') && !pathname.includes('/doctor/register')) {
        router.push('/doctor/login');
      }
      if (doctor && (pathname === '/doctor/login' || pathname === '/doctor/register')) {
        router.push('/doctor');
      }
    }
  }, [doctor, loading, pathname, router]);

  const login = (token: string, doctorData: Doctor) => {
    localStorage.setItem('doctorToken', token);
    setDoctor(doctorData);
    router.push('/doctor');
  };

  const logout = () => {
    localStorage.removeItem('doctorToken');
    setDoctor(null);
    router.push('/doctor/login');
  };

  const updateDoctorInfo = (data: Partial<Doctor>) => {
    setDoctor(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <DoctorAuthContext.Provider value={{ doctor, loading, login, logout, updateDoctorInfo }}>
      {children}
    </DoctorAuthContext.Provider>
  );
};

export const useDoctorAuth = () => {
  const context = useContext(DoctorAuthContext);
  if (context === undefined) {
    throw new Error('useDoctorAuth must be used within a DoctorAuthProvider');
  }
  return context;
};

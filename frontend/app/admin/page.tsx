'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  verificationStatus: string;
  registrationNumber: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(res.data.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      }
      console.error('Failed to fetch doctors', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to ${status} this doctor?`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/doctors/${id}/verify`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setDoctors(doctors.map(d => d.id === id ? { ...d, verificationStatus: status } : d));
    } catch (error) {
      alert('Failed to update status');
      console.error(error);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading Admin Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-ink-700">Doctor Approvals</h1>
        <button 
          onClick={() => { localStorage.removeItem('adminToken'); router.push('/admin/login'); }}
          className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-ink-500 border-b border-surface-200">
              <tr>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Specialty</th>
                <th className="px-6 py-4 font-medium">Reg. Number</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-ink-700">
              {doctors.map(doc => (
                <tr key={doc.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ink-700">{doc.name}</p>
                    <p className="text-xs text-ink-400">{doc.email}</p>
                  </td>
                  <td className="px-6 py-4">{doc.specialty}</td>
                  <td className="px-6 py-4 text-ink-500">{doc.registrationNumber}</td>
                  <td className="px-6 py-4 text-ink-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      doc.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      doc.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-gold-100 text-gold-700'
                    }`}>
                      {doc.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {doc.verificationStatus === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleVerify(doc.id, 'APPROVED')}
                          className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleVerify(doc.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-ink-400">
                    No doctors registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

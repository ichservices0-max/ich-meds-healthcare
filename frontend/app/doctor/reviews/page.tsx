'use client';

import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';

export default function DoctorReviews() {
  const { doctor, loading } = useDoctorAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (doctor) fetchReviews();
  }, [doctor]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/reviews`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setIsFetching(false);
    }
  };

  if (loading || isFetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Compute stats
  const total = reviews.length;
  const avg = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0.0';
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: total > 0 ? Math.round((reviews.filter((r) => r.rating === star).length / total) * 100) : 0,
  }));

  const StarRow = ({ filled }: { filled: number }) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar key={s} className={s <= filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} size={16} />
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reviews & Ratings</h1>

      {/* Summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center justify-center text-center"
        >
          <p className="text-6xl font-bold text-slate-900 dark:text-white">{avg}</p>
          <StarRow filled={Math.round(parseFloat(avg))} />
          <p className="mt-2 text-sm text-slate-500">{total} review{total !== 1 ? 's' : ''}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-3"
        >
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Rating Distribution</h2>
          {dist.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center space-x-3">
              <span className="w-6 text-sm font-medium text-slate-600 dark:text-slate-400">{star}</span>
              <FiStar className="text-amber-400 fill-amber-400" size={14} />
              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm text-slate-500">{count}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Review list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Patient Reviews</h2>
        </div>

        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <FiStar className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500">No reviews yet. Reviews from patients will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {review.patient?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{review.patient?.name || 'Anonymous'}</p>
                      <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <StarRow filled={review.rating} />
                </div>
                {review.reviewText && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-13">
                    {review.reviewText}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

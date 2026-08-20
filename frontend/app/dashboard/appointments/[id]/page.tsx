'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/dashboard/appointments/queue?id=${id}`)
    }
  }, [id, router])

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

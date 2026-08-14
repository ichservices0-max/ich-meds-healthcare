'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react'
import type { Doctor } from '@/lib/api'
import LivePulseRing from './LivePulseRing'
import AgoraRTC, {
  AgoraRTCProvider,
  useConnectionState,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack
} from 'agora-rtc-react'

interface VideoConsultationProps {
  isOpen: boolean
  onClose: () => void
  doctor?: Doctor | null
  roomId: string
}

export default function VideoConsultation(props: VideoConsultationProps) {
  const [client, setClient] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClient(AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }))
    }
  }, [])

  if (!client || !props.isOpen) return null

  return (
    <AnimatePresence>
      {props.isOpen && (
        <AgoraRTCProvider client={client}>
          <VideoCallInner {...props} />
        </AgoraRTCProvider>
      )}
    </AnimatePresence>
  )
}

function VideoCallInner({ isOpen, onClose, doctor, roomId }: VideoConsultationProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''
  const token = process.env.NEXT_PUBLIC_AGORA_TEMP_TOKEN || null

  // Connection State
  const connectionState = useConnectionState()
  
  // Join Channel
  useJoin({
    appid: appId,
    channel: roomId,
    token: token,
  }, isOpen)

  // Local Tracks
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isOpen)
  const { localCameraTrack } = useLocalCameraTrack(isOpen)

  // Publish Tracks
  usePublish([localMicrophoneTrack, localCameraTrack])

  // Remote Users
  const remoteUsers = useRemoteUsers()
  const remoteUser = remoteUsers.length > 0 ? remoteUsers[0] : null

  // Controls state
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)

  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setMuted(!isMicOn)
    }
  }, [isMicOn, localMicrophoneTrack])

  useEffect(() => {
    if (localCameraTrack) {
      localCameraTrack.setMuted(!isCamOn)
    }
  }, [isCamOn, localCameraTrack])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (connectionState === 'CONNECTED') {
      interval = setInterval(() => setCallDuration((d) => d + 1), 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(interval)
  }, [connectionState])

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  function handleEndCall() {
    onClose()
  }

  const isConnected = connectionState === 'CONNECTED'
  const stateColors: Record<string, string> = {
    DISCONNECTED: 'text-slate-400',
    CONNECTING: 'text-amber-400',
    CONNECTED: 'text-emerald-400',
    RECONNECTING: 'text-amber-500',
    DISCONNECTING: 'text-slate-400',
  }
  
  const stateLabels: Record<string, string> = {
    DISCONNECTED: 'Disconnected',
    CONNECTING: 'Connecting...',
    CONNECTED: 'Connected',
    RECONNECTING: 'Reconnecting...',
    DISCONNECTING: 'Disconnecting...',
  }

  const doctorAvatarUrl = doctor
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=1E40AF&color=fff&size=128`
    : ''

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`relative bg-dark border border-white/10 rounded-2xl overflow-hidden ${
          isFullscreen ? 'w-full h-full' : 'w-full max-w-3xl h-[560px]'
        }`}
      >
        {/* Remote video (main) */}
        <div className="w-full h-full bg-slate-900 absolute inset-0">
          {remoteUser ? (
            <RemoteUser user={remoteUser} className="w-full h-full object-cover" />
          ) : null}
        </div>

        {/* Placeholder when no remote user */}
        {!remoteUser && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 gap-4">
            {doctor && (
              <>
                <img src={doctorAvatarUrl} alt={doctor.name} className="w-20 h-20 rounded-2xl border-2 border-primary/40" />
                <p className="text-white font-semibold text-lg">{doctor.name}</p>
                <p className="text-slate-400 text-sm">{doctor?.specialty || ''}</p>
              </>
            )}
            <div className="flex items-center gap-2 mt-2">
              {connectionState === 'CONNECTING' && <LivePulseRing size="sm" color="blue" />}
              <span className={`text-sm font-medium ${stateColors[connectionState] || 'text-slate-400'}`}>
                {stateLabels[connectionState] || connectionState}
              </span>
            </div>
            {isConnected && !remoteUser && (
              <p className="text-slate-500 text-sm animate-pulse">Waiting for others to join...</p>
            )}
          </div>
        )}

        {/* Status bar (top) */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
          <div className="flex items-center gap-2">
            {isConnected && <LivePulseRing size="sm" color="teal" />}
            <span className={`text-sm font-medium ${stateColors[connectionState] || 'text-slate-400'}`}>
              {isConnected ? formatDuration(callDuration) : (stateLabels[connectionState] || connectionState)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen((v) => !v)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleEndCall}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Local video (PiP) */}
        <div className="video-pip z-10 w-40 h-56 absolute bottom-28 right-6 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
          {localCameraTrack ? (
            <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <span className="text-slate-400 text-xs">Starting camera...</span>
            </div>
          )}
          {!isCamOn && (
            <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-20">
              <VideoOff className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>

        {/* Controls bar (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-6 bg-gradient-to-t from-black/80 to-transparent z-10">
          {/* Mic toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMicOn
                ? 'bg-white/15 hover:bg-white/25 text-white'
                : 'bg-red-500/80 hover:bg-red-600 text-white'
            }`}
            title={isMicOn ? 'Mute' : 'Unmute'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </motion.button>

          {/* End call */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleEndCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/40 transition-all"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7 rotate-[135deg]" />
          </motion.button>

          {/* Camera toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCamOn(!isCamOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isCamOn
                ? 'bg-white/15 hover:bg-white/25 text-white'
                : 'bg-red-500/80 hover:bg-red-600 text-white'
            }`}
            title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

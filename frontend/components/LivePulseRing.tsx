'use client'

import { motion } from 'framer-motion'

interface LivePulseRingProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'green' | 'blue' | 'teal'
}

const sizeMap = {
  sm: { dot: 'w-3.5 h-3.5', ring: 'w-3.5 h-3.5' },
  md: { dot: 'w-5 h-5', ring: 'w-5 h-5' },
  lg: { dot: 'w-7 h-7', ring: 'w-7 h-7' },
}

const colorMap = {
  green: { bg: 'bg-emerald-500', border: 'border-dark', shadow: 'shadow-emerald-500/50' },
  blue: { bg: 'bg-primary', border: 'border-dark', shadow: 'shadow-primary/50' },
  teal: { bg: 'bg-secondary', border: 'border-dark', shadow: 'shadow-secondary/50' },
}

const ringColorMap = {
  green: 'bg-emerald-400',
  blue: 'bg-primary-400',
  teal: 'bg-secondary-400',
}

export default function LivePulseRing({ size = 'md', color = 'green' }: LivePulseRingProps) {
  const { dot, ring } = sizeMap[size]
  const { bg, border, shadow } = colorMap[color]
  const ringColor = ringColorMap[color]

  return (
    <span className="relative inline-flex items-center justify-center">
      {/* Pulse rings — two layered for a richer effect */}
      <motion.span
        className={`absolute rounded-full ${ring} ${ringColor} opacity-0`}
        animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.span
        className={`absolute rounded-full ${ring} ${ringColor} opacity-0`}
        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
      />
      {/* Dot */}
      <motion.span
        className={`relative ${dot} ${bg} ${border} border-2 rounded-full shadow-md ${shadow}`}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </span>
  )
}

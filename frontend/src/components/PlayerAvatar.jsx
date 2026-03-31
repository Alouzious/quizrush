import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'
import { useMemo } from 'react'

const BG_COLORS = [
  '#e21b3c', '#1368ce', '#d89e00', '#26890c',
  '#7b2ff7', '#f97316', '#0ea5e9', '#ec4899',
  '#14b8a6', '#8b5cf6',
]

export function getAvatarBg(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++)
    h = seed.charCodeAt(i) + ((h << 5) - h)
  return BG_COLORS[Math.abs(h) % BG_COLORS.length]
}

export default function PlayerAvatar({ seed, size = 80, showName = false, className = '' }) {
  const svg = useMemo(() => createAvatar(adventurer, {
    seed: seed || 'default',
    size,
    backgroundColor: [],
    backgroundType: [],
  }).toString(), [seed, size])

  const bg = getAvatarBg(seed || 'default')

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className="rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
        style={{ width: size, height: size, backgroundColor: bg, padding: size * 0.04 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {showName && (
        <span
          className="text-white font-black text-sm text-center truncate max-w-[100px] drop-shadow-lg"
        >
          {seed}
        </span>
      )}
    </div>
  )
}
import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAvatarBg } from './PlayerAvatar'

const CHARACTER_SEEDS = [
  'Bubbles','Shadow','Blaze','Luna','Nova','Storm',
  'Pixel','Comet','Frost','Echo','Titan','Spark',
  'Zigzag','Bolt','Drift','Clover','Jinx','Paws',
]

const ACCESSORY_SEEDS = [
  'Viking','Wizard','Ninja','Knight','Pirate','Cowboy',
  'Astronaut','Samurai','Chef','Rebel','Prince','Captain',
]

function AvatarThumb({ seed, size = 72, selected, onClick }) {
  const svg = useMemo(() => createAvatar(adventurer, {
    seed, size, backgroundColor: [], backgroundType: [],
  }).toString(), [seed, size])
  const bg = getAvatarBg(seed)
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      onClick={onClick}
      className="relative flex items-center justify-center p-1.5 rounded-2xl transition-all"
      style={{ outline: selected ? `4px solid #7c3aed` : 'none', outlineOffset: 2 }}
    >
      <div
        className="rounded-xl overflow-hidden shadow-lg"
        style={{ width: size, height: size, backgroundColor: bg, padding: 3 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center"
        >
          <span className="text-white text-xs font-black">✓</span>
        </motion.div>
      )}
    </motion.button>
  )
}

export default function AvatarPicker({ nickname, currentSeed, onDone }) {
  const [tab, setTab] = useState('character')
  const [selected, setSelected] = useState(currentSeed || nickname)

  const seeds = tab === 'character' ? CHARACTER_SEEDS : ACCESSORY_SEEDS

  const previewSvg = useMemo(() => createAvatar(adventurer, {
    seed: selected, size: 110, backgroundColor: [], backgroundType: [],
  }).toString(), [selected])
  const previewBg = getAvatarBg(selected)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="absolute right-0 top-0 bottom-0 w-80 flex flex-col shadow-2xl overflow-hidden"
          style={{ background: '#fff' }}
        >
          {/* Preview header */}
          <div
            className="flex flex-col items-center py-8 px-4"
            style={{ background: 'linear-gradient(160deg, #3d1a6e 0%, #7b2ff7 100%)' }}
          >
            <motion.div
              key={selected}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="rounded-2xl overflow-hidden shadow-2xl mb-3"
              style={{ width: 110, height: 110, backgroundColor: previewBg, padding: 5 }}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
            <p className="text-white font-black text-xl">{nickname}</p>
            <p className="text-white/60 text-sm mt-1">You're in! Pick your look</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-gray-100">
            {['character', 'accessory'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 font-bold text-sm capitalize transition-all ${
                  tab === t
                    ? 'text-purple-700 border-b-2 border-purple-700 -mb-0.5'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'character' ? 'Character' : 'Accessory'}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-3 gap-3"
            >
              {seeds.map(seed => (
                <AvatarThumb
                  key={seed}
                  seed={seed}
                  selected={selected === seed}
                  onClick={() => setSelected(seed)}
                />
              ))}
            </motion.div>
          </div>

          {/* Done */}
          <div className="p-4 border-t border-gray-100">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onDone(selected)}
              className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7b2ff7, #5c1a9e)' }}
            >
              Done
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
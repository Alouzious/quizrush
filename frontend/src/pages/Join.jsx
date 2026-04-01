import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import AvatarPicker from '../components/AvatarPicker'
import PlayerAvatar from '../components/PlayerAvatar'
import ThreeBackground from '../components/ThreeBackground'

export default function Join() {
  const { roomCode: paramCode } = useParams()
  const navigate = useNavigate()
  const { setNickname, setRoomCode, setAvatarSeed: saveAvatarSeed } = useGameStore()
  const [pin, setPin] = useState(paramCode || '')
  const [name, setName] = useState('')
  const [step, setStep] = useState('pin')
  const [avatarSeed, setAvatarSeed] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (paramCode) { setPin(paramCode); setStep('name') }
  }, [paramCode])

  const handlePin = (e) => {
    e.preventDefault()
    if (!pin.trim()) { setError('Enter a game PIN'); return }
    setError('')
    setStep('name')
  }

  const handleName = (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Enter your nickname'); return }
    setError('')
    setAvatarSeed(name)
    setStep('avatar')
  }

  const handleDone = (seed) => {
    setShowPicker(false)
    setAvatarSeed(seed)
  }

const handleJoin = () => {
  setNickname(name.trim())
  saveAvatarSeed(avatarSeed || name.trim())
  setRoomCode(pin.trim().toUpperCase())
  navigate(`/lobby/${pin.trim().toUpperCase()}`)
}

  return (
    <>
      <Helmet><title>Join Game — QuizRush</title></Helmet>
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #3d1a6e 0%, #7b2ff7 60%, #5c1a9e 100%)' }}
      >
        <ThreeBackground />
        {/* Animated bg circles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 200 + i * 100,
              height: 200 + i * 100,
              border: '1px solid rgba(255,255,255,0.06)',
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
            }}
            animate={{ scale: [1, 1.04, 1], rotate: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 4 + i, delay: i * 0.5 }}
          />
        ))}

        <AnimatePresence mode="wait">

          {/* STEP 1 — PIN */}
          {step === 'pin' && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="flex flex-col items-center w-full max-w-sm px-6"
            >
              <motion.h1
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-6xl font-black text-white mb-2 tracking-tight"
                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)', fontStyle: 'italic' }}
              >
                QuizRush!
              </motion.h1>
              <p className="text-white/60 mb-8 text-center">Enter the PIN you see on the big screen</p>
              <form onSubmit={handlePin} className="w-full flex flex-col gap-4">
                <input
                  className="w-full text-center text-3xl font-black tracking-widest rounded-2xl px-6 py-5 bg-white/10 border-2 border-white/20 text-white placeholder-white/30 outline-none focus:border-white/60 focus:bg-white/15 transition-all"
                  placeholder="Game PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value.toUpperCase())}
                  maxLength={8}
                  autoFocus
                />
                {error && <p className="text-red-300 text-sm text-center font-medium">{error}</p>}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  type="submit"
                  className="w-full py-4 rounded-2xl font-black text-xl text-gray-900 shadow-2xl transition-all"
                  style={{ background: 'linear-gradient(135deg, #ffffff, #e8e0ff)' }}
                >
                  Enter
                </motion.button>
              </form>
              <p className="text-white/40 text-xs mt-8">Create your own quiz at quizrush.app</p>
            </motion.div>
          )}

          {/* STEP 2 — NICKNAME */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="flex flex-col items-center w-full max-w-sm px-6"
            >
              <h2 className="text-4xl font-black text-white mb-2">What's your name?</h2>
              <p className="text-white/60 mb-8">Pick a cool nickname</p>
              <form onSubmit={handleName} className="w-full flex flex-col gap-4">
                <input
                  className="w-full text-center text-2xl font-bold rounded-2xl px-6 py-5 bg-white/10 border-2 border-white/20 text-white placeholder-white/30 outline-none focus:border-white/60 transition-all"
                  placeholder="Your nickname"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
                {error && <p className="text-red-300 text-sm text-center font-medium">{error}</p>}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  type="submit"
                  className="w-full py-4 rounded-2xl font-black text-xl text-gray-900 shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #ffffff, #e8e0ff)' }}
                >
                  OK!
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* STEP 3 — AVATAR PREVIEW & JOIN */}
          {step === 'avatar' && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="flex flex-col items-center w-full max-w-sm px-6"
            >
              <p className="text-white/60 mb-4 text-lg">You're in! See your nickname on screen?</p>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPicker(true)}
                className="cursor-pointer mb-4 relative"
              >
                <PlayerAvatar seed={avatarSeed} size={130} />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-lg">
                  ✏️
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-black text-3xl mb-6"
              >
                {name}
              </motion.p>

              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                onClick={handleJoin}
                className="w-full py-4 rounded-2xl font-black text-xl text-gray-900 shadow-2xl mb-3"
                style={{ background: 'linear-gradient(135deg, #ffffff, #e8e0ff)' }}
              >
                Join Game! 🎮
              </motion.button>
              <button
                onClick={() => setShowPicker(true)}
                className="text-white/50 text-sm hover:text-white/80 transition-colors"
              >
                Change avatar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar Picker Drawer */}
        {showPicker && (
          <AvatarPicker
            nickname={name}
            currentSeed={avatarSeed}
            onDone={handleDone}
          />
        )}
      </div>
    </>
  )
}
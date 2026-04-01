import { useEffect, useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'react-qr-code'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuthStore } from '../../store/authStore'
import PlayerAvatar from '../../components/PlayerAvatar'
import ThreeBackground from '../../components/ThreeBackground'

export default function GameLobby() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [players, setPlayers] = useState([])
  const joinUrl = `${window.location.origin}/join`

  const handleMessage = useCallback((msg) => {
    if (['room_info', 'player_joined', 'player_left'].includes(msg.event)) {
      setPlayers(msg.data.players || [])
    }
  }, [])

  const { send } = useWebSocket(handleMessage)

  useEffect(() => {
    send({ event: 'host_join', room_code: roomCode, token })
  }, [send, roomCode, token])

  const handleStart = () => {
    send({ event: 'host_start_game' })
    navigate(`/host/game/${roomCode}`)
  }

  return (
    <>
      <Helmet><title>Game Lobby — QuizRush</title></Helmet>
      <div
        className="min-h-screen relative overflow-hidden flex flex-col"
        style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #3d1a6e 40%, #6b3fa0 80%, #8b5fbf 100%)' }}
      >
        <ThreeBackground opacity={0.3} />
        {/* Subtle grid lines for classroom feel */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Animated rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 400 + i * 200, height: 400 + i * 200,
              border: '1px solid rgba(255,255,255,0.04)',
              bottom: '-20%', left: '50%', transform: 'translateX(-50%)',
            }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 6 + i * 2 }}
          />
        ))}

        {/* TOP — PIN Card + Start button */}
        <div className="relative z-10 flex items-start justify-between p-5">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-5"
          >
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Join at</p>
              <p className="font-black text-gray-800">quizrush.app</p>
              <p className="text-gray-400 text-xs mt-0.5">or with the <b>QuizRush!</b> app</p>
            </div>
            <div className="w-px h-14 bg-gray-200" />
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Game PIN:</p>
              <p className="text-5xl font-black text-gray-900 tracking-widest leading-none">
                {roomCode?.match(/.{1,3}/g)?.join(' ')}
              </p>
            </div>
            <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-inner">
              <QRCodeSVG value={joinUrl} size={72} />
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={players.length === 0}
            className="flex items-center gap-3 bg-white text-gray-900 font-black text-xl px-8 py-4 rounded-2xl shadow-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <span className="text-2xl">▶</span> Start
          </motion.button>
        </div>

        {/* CENTER — Logo */}
        <div className="relative z-10 flex flex-col items-center py-4">
          <motion.h1
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}
            className="text-6xl font-black text-white tracking-tight"
            style={{
              fontStyle: 'italic',
              textShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 60px rgba(123,47,247,0.4)',
            }}
          >
            QuizRush!
          </motion.h1>
        </div>

        {/* PLAYERS grid */}
        <div className="relative z-10 flex-1 flex flex-wrap justify-center content-start gap-4 px-6 pb-4">
          <AnimatePresence>
            {players.map(p => (
              <motion.div
                key={p.id || p.nickname}
                initial={{ scale: 0, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              >
                <PlayerAvatar seed={p.avatarSeed || p.nickname} size={90} showName />
              </motion.div>
            ))}
          </AnimatePresence>

          {players.length === 0 && (
            <motion.div
              className="flex flex-col items-center mt-12"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
              <p className="text-white text-2xl font-black">Waiting for participants...</p>
              <p className="text-white/50 mt-2">Share the PIN to let players join</p>
            </motion.div>
          )}
        </div>

        {/* BOTTOM bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 text-white/40 text-sm">
          <div className="flex items-center gap-2">
            <span>👥</span>
            <span className="text-white font-bold text-lg">{players.length}</span>
          </div>
          <div className="flex gap-4 text-xl">
            <span className="cursor-pointer hover:text-white/70 transition-colors">🔊</span>
            <span className="cursor-pointer hover:text-white/70 transition-colors">⚙️</span>
            <span className="cursor-pointer hover:text-white/70 transition-colors">⛶</span>
          </div>
        </div>
      </div>
    </>
  )
}
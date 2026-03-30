import { useEffect, useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import QRCode from 'react-qr-code'
import { Users, Copy, Play, Zap } from 'lucide-react'
import Button from '../../components/Button'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuthStore } from '../../store/authStore'
import { generateAvatar } from '../../utils/helpers'
import { staggerContainer, staggerItem } from '../../animations/variants'

export default function GameLobby() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [players, setPlayers] = useState([])
  const [copied, setCopied] = useState(false)
  const joinUrl = `${window.location.origin}/join/${roomCode}`

  const handleMessage = useCallback((msg) => {
    switch (msg.event) {
      case 'room_info':
        setPlayers(msg.data.players || [])
        break
      case 'player_joined':
        setPlayers(msg.data.players || [])
        break
      case 'player_left':
        setPlayers(msg.data.players || [])
        break
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

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Helmet><title>Game Lobby — QuizRush</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#2563EB] to-blue-800 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Zap size={28} className="text-white" />
            <h1 className="text-2xl font-extrabold text-white">Game Lobby</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Room code + QR */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl p-8">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6">Share This Code</h2>
              <div className="bg-[#F7F8FC] rounded-2xl p-6 text-center mb-6">
                <p className="text-gray-500 text-sm mb-2">Room Code</p>
                <p className="text-5xl font-extrabold text-[#2563EB] tracking-widest mb-4">{roomCode?.toUpperCase()}</p>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy size={14} /> {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl border-2 border-gray-100">
                  <QRCode value={joinUrl} size={160} />
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">Or scan QR code to join</p>
            </motion.div>

            {/* Player list */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-[#2563EB]" />
                  <h2 className="text-xl font-bold text-[#0F172A]">{players.length} Players</h2>
                </div>
                <div className="w-3 h-3 bg-[#10B981] rounded-full animate-pulse" />
              </div>

              <div className="overflow-y-auto max-h-64 mb-6">
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-3">
                  {players.map(p => (
                    <motion.div key={p.id || p.nickname} variants={staggerItem} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: generateAvatar(p.nickname) }}>
                        {p.nickname[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-sm text-[#0F172A] truncate">{p.nickname}</span>
                    </motion.div>
                  ))}
                </motion.div>
                {players.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">Waiting for players...</p>
                  </div>
                )}
              </div>

              <Button size="lg" className="w-full" onClick={handleStart} disabled={players.length === 0}>
                <Play size={20} /> Start Game
              </Button>
              {players.length === 0 && (
                <p className="text-center text-xs text-gray-400 mt-2">Need at least 1 player to start</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}

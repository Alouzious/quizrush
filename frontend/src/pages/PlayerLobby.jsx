import { useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Users, Zap } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useGameStore } from '../store/gameStore'
import { generateAvatar } from '../utils/helpers'
import { staggerContainer, staggerItem } from '../animations/variants'

export default function PlayerLobby() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { nickname, playerId, setPlayers, players, setGameStatus, setCurrentQuestion, setRoomCode } = useGameStore()

  const handleMessage = useCallback((msg) => {
    switch (msg.event) {
      case 'connected':
        useGameStore.getState().setPlayer(msg.player_id, nickname)
        break
      case 'player_joined':
        setPlayers(msg.data.players)
        break
      case 'game_started':
        setGameStatus('active')
        setCurrentQuestion(msg.data)
        navigate(`/game/${roomCode}`)
        break
    }
  }, [navigate, nickname, roomCode, setPlayers, setGameStatus, setCurrentQuestion])

  const { send } = useWebSocket(handleMessage)

  useEffect(() => {
    if (!nickname) { navigate('/join'); return }
    setRoomCode(roomCode)
    send({ event: 'join_room', room_code: roomCode, nickname, player_id: playerId })
  }, [send, roomCode, nickname, playerId, navigate, setRoomCode])

  return (
    <>
      <Helmet>
        <title>Waiting Room — QuizRush</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#2563EB] to-blue-800 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap size={32} className="text-white" />
            <h1 className="text-4xl font-extrabold text-white">QuizRush</h1>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 inline-block">
            <p className="text-blue-100 text-sm font-medium mb-1">Room Code</p>
            <p className="text-white text-4xl font-extrabold tracking-widest">{roomCode?.toUpperCase()}</p>
          </div>
          <p className="text-blue-200 mt-4 text-lg">Waiting for the host to start...</p>
        </motion.div>

        <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Users size={20} className="text-[#2563EB]" />
            <h2 className="text-lg font-bold text-[#0F172A]">{players.length} Players Joined</h2>
          </div>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-3">
            {players.map((p) => (
              <motion.div key={p.id || p.nickname} variants={staggerItem} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: generateAvatar(p.nickname) }}
                >
                  {p.nickname[0].toUpperCase()}
                </div>
                <span className="font-semibold text-[#0F172A] text-sm truncate">{p.nickname}</span>
              </motion.div>
            ))}
          </motion.div>
          {players.length === 0 && (
            <div className="text-center text-gray-400 py-6">
              <div className="w-10 h-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Waiting for players to join...</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

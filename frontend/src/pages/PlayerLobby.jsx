import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from '../hooks/useWebSocket'
import { useGameStore } from '../store/gameStore'
import PlayerAvatar from '../components/PlayerAvatar'
import ThreeBackground from '../components/ThreeBackground'

function getOrCreatePlayerId() {
  let pid = sessionStorage.getItem('quizrush_player_id')
  if (!pid) { pid = crypto.randomUUID(); sessionStorage.setItem('quizrush_player_id', pid) }
  return pid
}

export default function PlayerLobby() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { nickname, avatarSeed, setPlayers, players, setGameStatus, setCurrentQuestion, setRoomCode, setPlayer } = useGameStore()
  const joinedRef = useRef(false)

  const handleMessage = useCallback((msg) => {
    switch (msg.event) {
      case 'player_joined': setPlayers(msg.data.players); break
      case 'game_started':
        setGameStatus('active')
        setCurrentQuestion(msg.data)
        navigate(`/game/${roomCode}`)
        break
    }
  }, [navigate, roomCode, setPlayers, setGameStatus, setCurrentQuestion])

  const { send } = useWebSocket(handleMessage)

  useEffect(() => {
    if (!nickname) { navigate('/join'); return }
    if (joinedRef.current) return
    joinedRef.current = true
    const pid = getOrCreatePlayerId()
    setRoomCode(roomCode)
    setPlayer(pid, nickname)
    send({ event: 'join_room', room_code: roomCode, nickname, player_id: pid })
  }, [send, roomCode, nickname, navigate, setRoomCode, setPlayer])

  return (
    <>
      <Helmet><title>Waiting... — QuizRush</title></Helmet>
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a0a2e 0%, #3d1a6e 50%, #6b3fa0 100%)' }}
      >
        <ThreeBackground opacity={0.4} />
        {/* Animated ring bg */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 250 + i * 150, height: 250 + i * 150,
              border: '1px solid rgba(255,255,255,0.05)',
              top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
            }}
            animate={{ scale: [1, 1.06, 1], rotate: i % 2 === 0 ? [0, 5, 0] : [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 5 + i * 1.5 }}
          />
        ))}

        {/* PIN at top */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex justify-center pt-8"
        >
          <div className="bg-white/10 backdrop-blur rounded-2xl px-8 py-3 text-center border border-white/20">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Game PIN</p>
            <p className="text-white font-black text-3xl tracking-widest">{roomCode}</p>
          </div>
        </motion.div>

        {/* My avatar — big center */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-8">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.2 }}
            className="mb-4"
          >
            <PlayerAvatar seed={avatarSeed || nickname} size={140} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white font-black text-3xl mb-2"
          >
            {nickname}
          </motion.p>

          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-white/60 text-base"
          >
            Waiting for the host to start...
          </motion.p>
        </div>

        {/* Players joined at bottom */}
        {players.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 pb-8 px-4"
          >
            <p className="text-white/40 text-xs text-center mb-3 font-bold uppercase tracking-wider">
              {players.length} players joined
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <AnimatePresence>
                {players.map(p => (
                  <motion.div
                    key={p.id || p.nickname}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <PlayerAvatar seed={p.avatarSeed || p.nickname} size={48} showName />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </>
  )
}
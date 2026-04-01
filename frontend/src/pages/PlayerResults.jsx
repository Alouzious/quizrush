import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import PlayerAvatar from '../components/PlayerAvatar'
import ThreeBackground from '../components/ThreeBackground'
import confetti from 'canvas-confetti'
import { staggerContainer, staggerItem } from '../animations/variants'

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']
const RANK_LABELS = ['🥇', '🥈', '🥉']

export default function PlayerResults() {
  const navigate = useNavigate()
  const { nickname, avatarSeed, leaderboard, score, reset } = useGameStore()
  const myRank = leaderboard.findIndex(p => p.nickname === nickname) + 1

  useEffect(() => {
    // Redirect if missing session state (e.g. page refresh)
    if (!nickname) { navigate('/join', { replace: true }); return }
    if (myRank === 1) {
      confetti({ particleCount: 250, spread: 140, origin: { y: 0.3 }, colors: ['#ffd700','#7b2ff7','#e21b3c','#26890c'] })
      setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } }), 600)
    }
  }, [myRank, nickname, navigate])

  return (
    <>
      <Helmet><title>Results — QuizRush</title></Helmet>
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a0a2e 0%, #3d1a6e 60%, #6b3fa0 100%)' }}
      >
        <ThreeBackground opacity={0.35} />
        {/* Confetti bg dots */}
        {myRank === 1 && [...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              background: ['#ffd700','#e21b3c','#26890c','#1368ce','#7b2ff7'][i % 5],
              left: `${Math.random() * 100}%`,
              top: `-10px`,
            }}
            animate={{ y: ['0vh', '110vh'], rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)] }}
            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}

        {/* My result */}
        <div className="flex flex-col items-center pt-10 pb-4 px-6 relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            className="mb-3"
          >
            <PlayerAvatar seed={avatarSeed || nickname} size={110} />
          </motion.div>

          {myRank === 1 && (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
              className="text-yellow-400 font-black text-2xl mb-1"
            >
              Supreme win! 🏆
            </motion.p>
          )}

          <p className="text-white font-black text-2xl">{nickname}</p>
          <p className="text-white/60 text-lg">{score?.toLocaleString() || 0} pts</p>
        </div>

        {/* Leaderboard */}
        <div className="flex-1 bg-white/5 backdrop-blur mx-4 rounded-3xl p-4 border border-white/10 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col gap-2"
          >
            {leaderboard.slice(0, 8).map((p, idx) => (
              <motion.div
                key={p.nickname}
                variants={staggerItem}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: p.nickname === nickname
                    ? 'rgba(123,47,247,0.3)'
                    : 'rgba(255,255,255,0.05)',
                  border: p.nickname === nickname ? '2px solid rgba(123,47,247,0.6)' : '2px solid transparent',
                }}
              >
                <span className="text-xl w-8 text-center font-black" style={{ color: RANK_COLORS[idx] || '#fff' }}>
                  {idx < 3 ? RANK_LABELS[idx] : idx + 1}
                </span>
                <PlayerAvatar seed={p.avatarSeed || p.nickname} size={40} />
                <span className="text-white font-bold flex-1 truncate">{p.nickname}</span>
                <span className="text-white font-black text-lg">{p.score?.toLocaleString()}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Play again */}
        <div className="p-5 relative z-10">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => { reset(); navigate('/join') }}
            className="w-full py-4 rounded-2xl font-black text-xl text-gray-900 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #ffffff, #e8e0ff)' }}
          >
            Play Again 🎮
          </motion.button>
        </div>
      </div>
    </>
  )
}
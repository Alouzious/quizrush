import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Trophy, Home } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { getRankEmoji, generateAvatar } from '../utils/helpers'
import { staggerContainer, staggerItem } from '../animations/variants'
import confetti from 'canvas-confetti'
import Button from '../components/Button'

export default function PlayerResults() {
  const navigate = useNavigate()
  const { nickname, leaderboard, score, reset } = useGameStore()

  const myRank = leaderboard.findIndex(p => p.nickname === nickname) + 1

  useEffect(() => {
    if (myRank === 1) {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 } })
    }
  }, [myRank])

  const handlePlayAgain = () => {
    reset()
    navigate('/join')
  }

  return (
    <>
      <Helmet><title>Results — QuizRush</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#2563EB] to-blue-800 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold text-white mb-2">Game Over!</h1>
          {myRank > 0 && (
            <p className="text-blue-200 text-xl">
              You finished {getRankEmoji(myRank)} with {score.toLocaleString()} pts
            </p>
          )}
        </motion.div>

        <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl mb-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Final Leaderboard</h2>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex flex-col gap-3">
            {leaderboard.slice(0, 10).map((p, idx) => (
              <motion.div
                key={p.id || p.nickname}
                variants={staggerItem}
                className={`flex items-center gap-3 p-3 rounded-xl ${p.nickname === nickname ? 'bg-blue-50 border-2 border-[#2563EB]' : 'bg-gray-50'}`}
              >
                <span className="text-lg font-bold w-8 text-center">{getRankEmoji(idx + 1)}</span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: generateAvatar(p.nickname) }}
                >
                  {p.nickname[0].toUpperCase()}
                </div>
                <span className="font-semibold text-[#0F172A] flex-1">{p.nickname}</span>
                <span className="font-extrabold text-[#2563EB]">{p.score.toLocaleString()}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <Button variant="secondary" size="lg" onClick={handlePlayAgain}>
          <Home size={18} /> Play Again
        </Button>
      </div>
    </>
  )
}

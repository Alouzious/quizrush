import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Home } from 'lucide-react'
import { gameApi } from '../../services/api'
import { exportToCsv } from '../../utils/helpers'
import { staggerContainer, staggerItem } from '../../animations/variants'
import PlayerAvatar from '../../components/PlayerAvatar'
import ThreeBackground from '../../components/ThreeBackground'
import confetti from 'canvas-confetti'

const PODIUM_ORDER = [1, 0, 2]
const PODIUM_HEIGHTS = [160, 220, 130]
const PODIUM_COLORS = ['#C0C0C0', '#FFD700', '#CD7F32']
const RANK_BADGE_BG = ['#C0C0C0', '#FFD700', '#CD7F32']

export default function HostResults() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('drumroll')

  useEffect(() => {
    gameApi.getResults(gameId).then(res => {
      setResults(res.data.data)
      setLoading(false)
      setTimeout(() => {
        setPhase('podium')
        confetti({ particleCount: 200, spread: 140, origin: { y: 0.3 }, colors: ['#ffd700','#7b2ff7','#e21b3c','#26890c','#1368ce'] })
        setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } }), 700)
      }, 2500)
    }).catch(() => setLoading(false))
  }, [gameId])

  const handleExport = () => {
    if (!results?.leaderboard) return
    exportToCsv(results.leaderboard.map((p, i) => ({ rank: i + 1, nickname: p.nickname, score: p.score })), `quizrush-${gameId}.csv`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #1a0a2e, #3d1a6e)' }}>
        <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const leaderboard = results?.leaderboard || []
  const top3 = leaderboard.slice(0, 3)

  return (
    <>
      <Helmet><title>Results — QuizRush</title></Helmet>
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #3d1a6e 50%, #6b3fa0 100%)' }}
      >
        <ThreeBackground opacity={0.3} />
        {/* Confetti bits */}
        {phase === 'podium' && [...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-sm pointer-events-none"
            style={{
              background: ['#ffd700','#e21b3c','#26890c','#1368ce','#7b2ff7','#ec4899'][i % 6],
              left: `${5 + Math.random() * 90}%`,
              top: -12,
            }}
            animate={{ y: ['0vh', '110vh'], rotate: [0, (Math.random() > 0.5 ? 1 : -1) * 540] }}
            transition={{ duration: 2.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}

        <AnimatePresence mode="wait">
          {/* DRUM ROLL phase */}
          {phase === 'drumroll' && (
            <motion.div
              key="drumroll"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center relative z-10"
            >
              <motion.h1
                className="text-6xl font-black text-white mb-6 tracking-tight"
                style={{ fontStyle: 'italic', textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              >
                QuizRush!
              </motion.h1>
              {leaderboard[0] && (
                <motion.div
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-black mb-4 shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}
                  >
                    3
                  </div>
                  <p className="text-white font-black text-xl">{leaderboard[0].nickname}</p>
                </motion.div>
              )}
              <motion.div
                className="mt-10 flex flex-col items-center gap-2"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                <div className="w-8 h-8 border-3 border-white/40 border-t-white rounded-full animate-spin" />
                <p className="text-white/60 font-bold text-lg">Drum roll...</p>
              </motion.div>
            </motion.div>
          )}

          {/* PODIUM phase */}
          {phase === 'podium' && (
            <motion.div
              key="podium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col relative z-10"
            >
              {/* Title */}
              <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center pt-6 pb-2"
              >
                <h1
                  className="text-5xl font-black text-white"
                  style={{ fontStyle: 'italic', textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                >
                  QuizRush!
                </h1>
                {leaderboard[0] && (
                  <div className="inline-block bg-white/10 rounded-2xl px-6 py-2 mt-2 border border-white/20">
                    <p className="text-yellow-400 font-black text-lg">{leaderboard[0].nickname}</p>
                  </div>
                )}
              </motion.div>

              {/* Podium visual */}
              <div className="flex items-end justify-center gap-4 px-8 pt-4 pb-2">
                {PODIUM_ORDER.map((pos, i) => {
                  const player = top3[pos]
                  if (!player) return <div key={i} className="flex-1" />
                  const isFirst = pos === 0
                  return (
                    <motion.div
                      key={pos}
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 180, damping: 20 }}
                      className="flex flex-col items-center flex-1"
                    >
                      {/* Avatar above podium */}
                      <motion.div
                        animate={isFirst ? { y: [0, -8, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <PlayerAvatar seed={player.avatarSeed || player.nickname} size={isFirst ? 90 : 70} />
                      </motion.div>
                      <p className="text-white font-black text-sm mt-2 truncate max-w-[90px] text-center">
                        {player.nickname}
                      </p>
                      <p className="text-white/60 text-xs mb-2">{player.score}</p>

                      {/* Podium block */}
                      <div
                        className="w-full rounded-t-2xl flex items-start justify-center pt-3 shadow-2xl"
                        style={{ height: PODIUM_HEIGHTS[i], background: 'linear-gradient(180deg, #4a2a7a, #3d1a6e)' }}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-gray-900 font-black text-2xl shadow-xl"
                          style={{ backgroundColor: RANK_BADGE_BG[i] }}
                        >
                          {pos + 1}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Rest of leaderboard */}
              {leaderboard.length > 3 && (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="mx-4 bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
                >
                  {leaderboard.slice(3, 8).map((p, idx) => (
                    <motion.div
                      key={p.nickname}
                      variants={staggerItem}
                      className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0"
                    >
                      <span className="text-white/40 font-black w-6 text-center">{idx + 4}</span>
                      <PlayerAvatar seed={p.avatarSeed || p.nickname} size={36} />
                      <span className="text-white font-bold flex-1 truncate">{p.nickname}</span>
                      <span className="text-white/70 font-black">{p.score.toLocaleString()}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 p-4 mt-auto">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExport}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-bold border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Download size={18} /> Export CSV
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-gray-900 shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #ffffff, #e8e0ff)' }}
                >
                  <Home size={18} /> Dashboard
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
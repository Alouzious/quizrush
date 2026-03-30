import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Trophy, Download, Home } from 'lucide-react'
import Button from '../../components/Button'
import { gameApi } from '../../services/api'
import { getRankEmoji, generateAvatar, exportToCsv } from '../../utils/helpers'
import { staggerContainer, staggerItem } from '../../animations/variants'
import confetti from 'canvas-confetti'

export default function HostResults() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gameApi.getResults(gameId).then(res => {
      setResults(res.data.data)
      setLoading(false)
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } })
    }).catch(() => setLoading(false))
  }, [gameId])

  const handleExport = () => {
    if (!results?.leaderboard) return
    const data = results.leaderboard.map((p, i) => ({
      rank: i + 1,
      nickname: p.nickname,
      score: p.score
    }))
    exportToCsv(data, `quizrush-results-${gameId}.csv`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const leaderboard = results?.leaderboard || []

  return (
    <>
      <Helmet><title>Game Results — QuizRush</title></Helmet>
      <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1e293b] p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 pt-6">
            <Trophy size={56} className="text-yellow-400 mx-auto mb-4" />
            <h1 className="text-4xl font-extrabold text-white mb-2">Game Complete!</h1>
            {leaderboard[0] && (
              <p className="text-blue-300 text-lg">🏆 Winner: <strong className="text-white">{leaderboard[0].nickname}</strong> with {leaderboard[0].score.toLocaleString()} pts</p>
            )}
          </motion.div>

          <div className="bg-white/5 backdrop-blur rounded-3xl p-6 mb-6 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-4">Final Leaderboard</h2>
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex flex-col gap-3">
              {leaderboard.map((p, idx) => (
                <motion.div key={p.id || p.nickname} variants={staggerItem} className={`flex items-center gap-4 p-4 rounded-2xl ${idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5'}`}>
                  <span className="text-2xl w-10 text-center">{getRankEmoji(idx + 1)}</span>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: generateAvatar(p.nickname) }}
                  >
                    {p.nickname[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-white flex-1 text-lg">{p.nickname}</span>
                  <span className="font-extrabold text-[#2563EB] text-xl">{p.score.toLocaleString()}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10 hover:text-white" onClick={handleExport}>
              <Download size={18} /> Export CSV
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/dashboard')}>
              <Home size={18} /> Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

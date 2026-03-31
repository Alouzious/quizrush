import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Play, Edit, Trash2, LogOut, Zap, BookOpen, Clock, ChevronRight } from 'lucide-react'
import { quizApi, gameApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useGameStore } from '../../store/gameStore'
import { staggerContainer, staggerItem } from '../../animations/variants'

const CARD_GRADIENTS = [
  'from-[#e21b3c] to-[#a0112a]',
  'from-[#1368ce] to-[#0d4a9e]',
  'from-[#7b2ff7] to-[#5c1a9e]',
  'from-[#d89e00] to-[#a07200]',
  'from-[#26890c] to-[#1a6008]',
  'from-[#f97316] to-[#c2410c]',
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { setGameId } = useGameStore()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [startingQuiz, setStartingQuiz] = useState(null)
  const [deletingQuiz, setDeletingQuiz] = useState(null)

  useEffect(() => {
    quizApi.list().then(res => {
      setQuizzes(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleStart = async (quizId) => {
    setStartingQuiz(quizId)
    try {
      const res = await gameApi.create(quizId)
      const { room_code, game_id } = res.data.data
      setGameId(game_id)
      navigate(`/host/lobby/${room_code}`)
    } catch {
      alert('Failed to start game. Please try again.')
    } finally {
      setStartingQuiz(null)
    }
  }

  const handleDelete = async (quizId) => {
    if (!confirm('Delete this quiz?')) return
    setDeletingQuiz(quizId)
    await quizApi.delete(quizId)
    setQuizzes(q => q.filter(quiz => quiz.id !== quizId))
    setDeletingQuiz(null)
  }

  return (
    <>
      <Helmet>
        <title>Dashboard — QuizRush</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #1a0a2e 0%, #3d1a6e 50%, #6b3fa0 100%)' }}>

        {/* TOP NAV */}
        <div className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10"
          style={{ background: 'rgba(26,10,46,0.85)' }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #7b2ff7, #5c1a9e)' }}>
                <Zap size={20} className="text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight" style={{ fontStyle: 'italic' }}>
                QuizRush!
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2 border border-white/10">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center text-white font-black text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-white/80 text-sm font-medium">Hi, {user?.name}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => { logout(); navigate('/') }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign Out</span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* HEADER ROW */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h1 className="text-4xl font-black text-white mb-1">My Quizzes</h1>
              <p className="text-white/50 text-lg">
                {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} ready to play
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(123,47,247,0.5)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/quiz/new')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-lg shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #7b2ff7, #5c1a9e)' }}
            >
              <Plus size={22} />
              New Quiz
            </motion.button>
          </motion.div>

          {/* QUIZ CARDS */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-52 rounded-3xl animate-pulse bg-white/10" />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #7b2ff7, #5c1a9e)' }}
              >
                <Plus size={48} className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-3">No quizzes yet!</h2>
              <p className="text-white/50 text-lg mb-8 max-w-md">
                Create your first quiz and host a live game for your audience
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/quiz/new')}
                className="px-8 py-4 rounded-2xl text-white font-black text-xl shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #7b2ff7, #5c1a9e)' }}
              >
                Create My First Quiz 🎮
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {quizzes.map((quiz, idx) => (
                <motion.div
                  key={quiz.id}
                  variants={staggerItem}
                  whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
                  className="rounded-3xl overflow-hidden shadow-xl border border-white/10 cursor-pointer group"
                  style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
                >
                  {/* Card top color strip */}
                  <div className={`h-3 w-full bg-gradient-to-r ${CARD_GRADIENTS[idx % CARD_GRADIENTS.length]}`} />

                  <div className="p-6">
                    {/* Quiz icon + title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${CARD_GRADIENTS[idx % CARD_GRADIENTS.length]}`}
                      >
                        <BookOpen size={22} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-white truncate mb-1">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-white/50 text-sm line-clamp-2">{quiz.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex items-center gap-1.5 text-white/40 text-sm">
                        <BookOpen size={14} />
                        <span>{quiz.question_count} question{quiz.question_count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/40 text-sm">
                        <Clock size={14} />
                        <span>~{Math.ceil((quiz.question_count || 1) * 0.5)} min</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleStart(quiz.id)}
                        disabled={startingQuiz === quiz.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-black text-base shadow-lg disabled:opacity-60 transition-all"
                        style={{ background: 'linear-gradient(135deg, #7b2ff7, #5c1a9e)' }}
                      >
                        {startingQuiz === quiz.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Play size={18} fill="white" />
                            Start
                          </>
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => navigate(`/quiz/${quiz.id}/edit`)}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                      >
                        <Edit size={16} className="text-white" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => handleDelete(quiz.id)}
                        disabled={deletingQuiz === quiz.id}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 transition-colors border border-red-500/20"
                      >
                        {deletingQuiz === quiz.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={16} className="text-red-400" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} className="text-white/40" />
                  </div>
                </motion.div>
              ))}

              {/* Add new card */}
              <motion.div
                variants={staggerItem}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/quiz/new')}
                className="rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-8 cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all min-h-[220px]"
              >
                <motion.div
                  animate={{ rotate: [0, 90, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(123,47,247,0.3)' }}
                >
                  <Plus size={32} className="text-purple-400" />
                </motion.div>
                <p className="text-white/60 font-black text-lg">New Quiz</p>
                <p className="text-white/30 text-sm mt-1">Click to create</p>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
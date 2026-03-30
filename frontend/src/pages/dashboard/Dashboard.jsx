import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Plus, Play, Edit, Trash2, Zap, LogOut } from 'lucide-react'
import Button from '../../components/Button'
import { quizApi, gameApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { staggerContainer, staggerItem, pageVariants } from '../../animations/variants'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [startingQuiz, setStartingQuiz] = useState(null)

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
      navigate(`/host/lobby/${res.data.data.room_code}`)
    } catch {
      alert('Failed to start game. Please try again.')
    } finally {
      setStartingQuiz(null)
    }
  }

  const handleDelete = async (quizId) => {
    if (!confirm('Delete this quiz?')) return
    await quizApi.delete(quizId)
    setQuizzes(q => q.filter(quiz => quiz.id !== quizId))
  }

  return (
    <>
      <Helmet>
        <title>Dashboard — QuizRush</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <motion.div variants={pageVariants} initial="initial" animate="animate" className="min-h-screen bg-[#F7F8FC]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-[#0F172A]">QuizRush</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm font-medium hidden sm:block">Hi, {user?.name}</span>
              <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/') }}>
                <LogOut size={16} /> Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-[#0F172A]">My Quizzes</h1>
              <p className="text-gray-500 mt-1">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}</p>
            </div>
            <Button onClick={() => navigate('/quiz/new')}>
              <Plus size={18} /> New Quiz
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />)}
            </div>
          ) : quizzes.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-[#2563EB]" />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-2">No quizzes yet</h2>
              <p className="text-gray-500 mb-6">Create your first quiz to get started</p>
              <Button onClick={() => navigate('/quiz/new')}>Create My First Quiz</Button>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map(quiz => (
                <motion.div key={quiz.id} variants={staggerItem} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2 truncate">{quiz.title}</h3>
                  {quiz.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{quiz.description}</p>}
                  <p className="text-sm text-gray-400 mb-5">{quiz.question_count} questions</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleStart(quiz.id)} loading={startingQuiz === quiz.id}>
                      <Play size={14} /> Start
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/quiz/${quiz.id}/edit`)}>
                      <Edit size={14} />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(quiz.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  )
}

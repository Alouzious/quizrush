import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, SkipForward, StopCircle, Zap } from 'lucide-react'
import Button from '../../components/Button'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useTimer } from '../../hooks/useTimer'

const BAR_COLORS = ['bg-[#2563EB]', 'bg-[#F97316]', 'bg-[#10B981]', 'bg-[#8B5CF6]']

export default function HostGame() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [questionNum, setQuestionNum] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(1)
  const [playerCount, setPlayerCount] = useState(0)
  const [answerStats, setAnswerStats] = useState([])
  const [answeredCount, setAnsweredCount] = useState(0)
  const { timeLeft, start } = useTimer(20)

  const handleMessage = useCallback((msg) => {
    switch (msg.event) {
      case 'game_started':
      case 'next_question':
        setQuestion(msg.data.question)
        setQuestionNum(msg.data.question_number)
        setTotalQuestions(msg.data.total_questions)
        setAnswerStats([])
        setAnsweredCount(0)
        start(msg.data.timer)
        break
      case 'answer_stats':
        setAnswerStats(msg.data.stats || [])
        setAnsweredCount(prev => prev + 1)
        break
      case 'player_joined':
      case 'player_left':
        setPlayerCount(msg.data.players?.length || 0)
        break
      case 'game_ended':
        navigate(`/host/results/${roomCode}`)
        break
    }
  }, [navigate, roomCode, start])

  const { send } = useWebSocket(handleMessage)

  const handleNext = () => send({ event: 'host_next_question' })
  const handleEnd = () => {
    if (confirm('End the game now?')) send({ event: 'host_end_game' })
  }

  const timerPercent = question ? (timeLeft / (question.time_limit || 20)) * 100 : 100

  return (
    <>
      <Helmet><title>Hosting — QuizRush</title></Helmet>
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-[#2563EB]" />
            <span className="font-bold">{roomCode?.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users size={16} />
              <span>{playerCount} players</span>
            </div>
            <Button variant="danger" size="sm" onClick={handleEnd}>
              <StopCircle size={16} /> End Game
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {question ? (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-3xl"
              >
                {/* Question info */}
                <div className="text-center mb-6">
                  <p className="text-gray-400 text-sm mb-2">Question {questionNum} of {totalQuestions}</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{question.text}</h2>
                  <div className="h-2 bg-white/10 rounded-full w-64 mx-auto">
                    <div className="h-full bg-[#F97316] rounded-full transition-all" style={{ width: `${timerPercent}%` }} />
                  </div>
                  <p className={`text-2xl font-bold mt-2 ${timeLeft <= 5 ? 'text-[#EF4444]' : 'text-white'}`}>{timeLeft}s</p>
                </div>

                {/* Answer stats */}
                <div className="bg-white/5 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-300">Live Answers</h3>
                    <span className="text-sm text-gray-400">{answeredCount} answered</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {question.answers?.map((a, idx) => (
                      <div key={a.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 w-4">{String.fromCharCode(65 + idx)}</span>
                        <div className="flex-1 bg-white/10 rounded-full h-8 overflow-hidden">
                          <motion.div
                            className={`h-full ${BAR_COLORS[idx]} flex items-center px-3`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (answerStats[idx]?.count || 0) / Math.max(1, playerCount) * 100)}%` }}
                            transition={{ type: 'spring', stiffness: 100 }}
                          >
                            <span className="text-white text-xs font-bold">{answerStats[idx]?.count || 0}</span>
                          </motion.div>
                        </div>
                        <span className="text-sm text-white font-medium w-24 truncate">{a.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button size="lg" variant="secondary" onClick={handleNext}>
                    <SkipForward size={20} />
                    {questionNum >= totalQuestions ? 'Show Results' : 'Next Question'}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Connecting...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

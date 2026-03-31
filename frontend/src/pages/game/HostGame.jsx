import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuthStore } from '../../store/authStore'
import { useGameStore } from '../../store/gameStore'
import { useTimer } from '../../hooks/useTimer'

const ANSWERS = [
  { bg: '#e21b3c', darkBg: '#a0112a', shape: '▲' },
  { bg: '#1368ce', darkBg: '#0d4a9e', shape: '◆' },
  { bg: '#d89e00', darkBg: '#a07200', shape: '●' },
  { bg: '#26890c', darkBg: '#1a6008', shape: '■' },
]

export default function HostGame() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { gameId } = useGameStore()
  const [question, setQuestion] = useState(null)
  const [questionNum, setQuestionNum] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(1)
  const [playerCount, setPlayerCount] = useState(0)
  const [answerStats, setAnswerStats] = useState({})
  const [answeredCount, setAnsweredCount] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const { timeLeft, start } = useTimer(20)

  const handleMessage = useCallback((msg) => {
    switch (msg.event) {
      case 'game_started':
      case 'next_question':
        setQuestion(msg.data.question)
        setQuestionNum(msg.data.question_number)
        setTotalQuestions(msg.data.total_questions)
        setAnswerStats({})
        setAnsweredCount(0)
        setShowResults(false)
        start(msg.data.timer || 20)
        break
      case 'answer_stats': {
        const m = {}
        ;(msg.data.stats || []).forEach(s => { m[s.answer_id] = s.count })
        setAnswerStats(m)
        setAnsweredCount(msg.data.answered_count || 0)
        break
      }
      case 'question_ended': setShowResults(true); break
      case 'player_joined':
      case 'player_left':
      case 'room_info':
        setPlayerCount(msg.data.players?.length || 0)
        break
      case 'game_ended':
        navigate(`/host/results/${gameId}`)
        break
    }
  }, [navigate, gameId, start])

  const { send } = useWebSocket(handleMessage)
  useEffect(() => { send({ event: 'host_join', room_code: roomCode, token }) }, [send, roomCode, token])

  const handleNext = () => send({ event: 'host_next_question' })
  const handleEnd = () => { if (confirm('End game?')) send({ event: 'host_end_game' }) }

  const maxCount = Math.max(1, ...Object.values(answerStats))
  const timeLimit = question?.time_limit || 20

  return (
    <>
      <Helmet><title>Hosting — QuizRush</title></Helmet>
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #2d0f52 40%, #4a1d8a 70%, #6b3fa0 100%)' }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <AnimatePresence mode="wait">
          {question ? (
            <motion.div
              key={question.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-screen relative z-10"
            >
              {/* Question bar */}
              <motion.div
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                className="bg-white mx-4 mt-4 rounded-2xl px-6 py-4 flex items-center justify-between shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm font-bold">
                    {questionNum} of {totalQuestions}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 text-center flex-1 px-4">
                  {question.text}
                </h2>
                {showResults && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="bg-gray-900 text-white font-black px-6 py-2 rounded-xl text-sm whitespace-nowrap"
                  >
                    Next →
                  </motion.button>
                )}
              </motion.div>

              {/* Center: timer or bar chart */}
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                {!showResults ? (
                  <div className="flex items-center gap-16">
                    {/* Big timer bubble */}
                    <motion.div
                      animate={timeLeft <= 5 ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.4 }}
                      className="flex flex-col items-center"
                    >
                      <div
                        className="w-28 h-28 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white/20"
                        style={{ background: timeLeft <= 5 ? '#e21b3c' : 'rgba(123,47,247,0.8)' }}
                      >
                        {timeLeft}
                      </div>
                    </motion.div>

                    {/* Answer count bubble */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        key={answeredCount}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className="w-24 h-24 rounded-full bg-white/15 border-4 border-white/20 flex items-center justify-center text-white text-4xl font-black shadow-xl mb-2"
                      >
                        {answeredCount}
                      </motion.div>
                      <p className="text-white/60 font-bold text-sm uppercase tracking-wider">Answers</p>
                    </div>
                  </div>
                ) : (
                  /* Bar chart */
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end justify-center gap-8 w-full max-w-lg"
                    style={{ height: 200 }}
                  >
                    {question.answers?.map((a, idx) => {
                      const style = ANSWERS[idx] || ANSWERS[0]
                      const count = answerStats[a.id] || 0
                      const heightPct = (count / maxCount) * 100
                      return (
                        <div key={a.id} className="flex flex-col items-center gap-2 flex-1">
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-white font-black text-lg"
                          >
                            {count}
                            {a.is_correct && <span className="text-green-400 ml-1">✓</span>}
                          </motion.span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(8, heightPct)}%` }}
                            transition={{ type: 'spring', stiffness: 80, damping: 15, delay: idx * 0.05 }}
                            className="w-full rounded-t-xl"
                            style={{ backgroundColor: a.is_correct ? style.bg : style.darkBg, minHeight: 16 }}
                          />
                          <span className="text-white/60 text-xl">{style.shape}</span>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </div>

              {/* Bottom answer bars */}
              <div className="grid grid-cols-2 gap-2 px-4 pb-2">
                {question.answers?.map((a, idx) => {
                  const style = ANSWERS[idx] || ANSWERS[0]
                  const isCorrect = showResults && a.is_correct
                  const isWrong = showResults && !a.is_correct
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: isWrong ? 0.5 : 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="flex items-center justify-between px-5 py-4 rounded-2xl shadow-xl"
                      style={{ backgroundColor: style.bg }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white text-2xl font-black">{style.shape}</span>
                        <span className="text-white font-black text-base truncate max-w-[160px]">{a.text}</span>
                      </div>
                      {showResults && (
                        <span className="text-white text-2xl font-black">
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Bottom info bar */}
              <div className="flex items-center justify-between px-5 py-2 text-white/40 text-xs mb-1">
                <span className="font-bold">{questionNum}/{totalQuestions}</span>
                <div className="flex items-center gap-2">
                  <span>🔒 quizrush.app</span>
                  <span className="text-white/60 font-bold">Game PIN: {roomCode}</span>
                </div>
                <div className="flex gap-3 text-base">
                  <button onClick={handleEnd} className="hover:text-white transition-colors">⚙️</button>
                  <button className="hover:text-white transition-colors">⛶</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center relative z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white/60 font-bold">Connecting to game...</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
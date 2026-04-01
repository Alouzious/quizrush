import { useEffect, useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from '../hooks/useWebSocket'
import { useTimer } from '../hooks/useTimer'
import { useGameStore } from '../store/gameStore'
import { shakeVariant } from '../animations/variants'
import PlayerAvatar from '../components/PlayerAvatar'
import ThreeBackground from '../components/ThreeBackground'
import confetti from 'canvas-confetti'

const ANSWERS = [
  { bg: '#e21b3c', darkBg: '#a0112a', shape: '▲' },
  { bg: '#1368ce', darkBg: '#0d4a9e', shape: '◆' },
  { bg: '#d89e00', darkBg: '#a07200', shape: '●' },
  { bg: '#26890c', darkBg: '#1a6008', shape: '■' },
]

export default function PlayerGame() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { nickname, avatarSeed, currentQuestion, setCurrentQuestion, setLeaderboard, setGameStatus, score, setScore } = useGameStore()
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answerResult, setAnswerResult] = useState(null)
  const [questionNum, setQuestionNum] = useState(1)
  const [totalQ, setTotalQ] = useState(1)
  const { timeLeft, start } = useTimer(20)

  const handleMessage = useCallback((msg) => {
    switch (msg.event) {
      case 'answer_received':
        setAnswerResult(msg.data)
        if (msg.data.correct) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#7b2ff7','#26890c','#ffd700'] })
          setScore(prev => (prev || 0) + (msg.data.points || 0))
        }
        break
      case 'leaderboard_update': setLeaderboard(msg.data.leaderboard); break
      case 'next_question':
        setSelectedAnswer(null)
        setAnswerResult(null)
        setCurrentQuestion(msg.data)
        setQuestionNum(msg.data.question_number || 1)
        setTotalQ(msg.data.total_questions || 1)
        start(msg.data.timer || 20)
        break
      case 'game_ended':
        setGameStatus('finished')
        setLeaderboard(msg.data.leaderboard)
        navigate(`/results/${roomCode}`)
        break
    }
  }, [navigate, roomCode, setCurrentQuestion, setLeaderboard, setGameStatus, setScore, start])

  const { send } = useWebSocket(handleMessage)

  useEffect(() => {
    if (!nickname) { navigate('/join'); return }
    if (currentQuestion) start(currentQuestion.timer || 20)
  }, [])

  const handleAnswer = (answerId) => {
    if (selectedAnswer || answerResult) return
    setSelectedAnswer(answerId)
    const pid = sessionStorage.getItem('quizrush_player_id')
    send({ event: 'submit_answer', question_id: currentQuestion?.question?.id, answer_id: answerId, room_code: roomCode, player_id: pid })
  }

  const question = currentQuestion?.question
  const timeLimit = currentQuestion?.timer || 20
  const timerPct = Math.max(0, (timeLeft / timeLimit) * 100)

  // Waiting screen
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a0a2e 0%, #3d1a6e 100%)' }}>
        <ThreeBackground opacity={0.4} />
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mb-6 relative z-10"
        >
          <PlayerAvatar seed={avatarSeed || nickname} size={120} />
        </motion.div>
        <p className="text-white font-black text-2xl mb-2 relative z-10">{nickname}</p>
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="text-white/60 text-lg relative z-10"
        >
          Get ready...
        </motion.p>
      </div>
    )
  }

  // Result screen
  if (answerResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: answerResult.correct
          ? 'linear-gradient(160deg, #0f4d08, #26890c)'
          : 'linear-gradient(160deg, #1a0a2e, #3d1a6e)' }}
      >
        <ThreeBackground opacity={0.3} />
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between p-5">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg">
            {questionNum}
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-red-500 rounded-sm" />
              <div className="bg-blue-500 rounded-sm" />
              <div className="bg-yellow-500 rounded-sm" />
              <div className="bg-green-500 rounded-sm" />
            </div>
            <span className="text-white font-bold text-sm">Quiz</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          {answerResult.correct ? (
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-2xl mb-6"
              >
                <span className="text-7xl text-green-600">✓</span>
              </motion.div>
              <h2 className="text-white text-5xl font-black mb-4">Correct!</h2>
              {(answerResult.streak || 0) > 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 mb-3"
                >
                  <span className="text-orange-400 text-2xl">🔥</span>
                  <span className="text-white/80 text-xl font-bold">
                    Answer Streak {answerResult.streak}
                  </span>
                </motion.div>
              )}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                className="bg-gray-900 rounded-2xl px-10 py-4 shadow-2xl"
              >
                <p className="text-white text-4xl font-black">+{answerResult.points}</p>
              </motion.div>
              {answerResult.podium && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/70 mt-5 text-lg"
                >
                  🏆 You're on the podium!
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 rounded-full bg-red-500 flex items-center justify-center shadow-2xl mb-6">
                <span className="text-7xl text-white">✗</span>
              </div>
              <h2 className="text-white text-5xl font-black mb-4">Incorrect</h2>
              <p className="text-white/60 text-xl">Answer streak lost</p>
              {answerResult.podium && (
                <p className="text-white/60 mt-3 text-lg">Still on the podium! 🏆</p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <Helmet><title>Playing — QuizRush</title></Helmet>
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a0a2e 0%, #3d1a6e 60%, #6b3fa0 100%)' }}
      >
        <ThreeBackground opacity={0.3} />
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg">
            {questionNum}
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-red-500 rounded-sm" />
              <div className="bg-blue-500 rounded-sm" />
              <div className="bg-yellow-500 rounded-sm" />
              <div className="bg-green-500 rounded-sm" />
            </div>
            <span className="text-white font-bold text-sm">Quiz</span>
          </div>
        </div>

        {/* Timer progress bar */}
        <div className="relative z-10 h-1.5 mx-5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: timeLeft <= 5 ? '#e21b3c' : 'linear-gradient(90deg, #7b2ff7, #e21b3c)' }}
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Timer circle */}
        <div className="relative z-10 flex justify-center py-5">
          <motion.div
            animate={timeLeft <= 5 ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.4 }}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-2xl border-4 border-white/20"
            style={{ background: timeLeft <= 5 ? '#e21b3c' : 'rgba(123,47,247,0.8)' }}
          >
            {timeLeft}
          </motion.div>
        </div>

        {/* 2x2 Answer buttons */}
        <div className="relative z-10 flex-1 grid grid-cols-2 gap-3 px-3 pb-4">
          {question?.answers?.map((answer, idx) => {
            const style = ANSWERS[idx] || ANSWERS[0]
            const isSelected = selectedAnswer === answer.id
            const isCorrect = answerResult?.correct_answer_id === answer.id
            return (
              <motion.button
                key={answer.id}
                variants={shakeVariant}
                animate={isSelected && answerResult && !answerResult.correct ? 'shake' : 'idle'}
                whileTap={!selectedAnswer ? { scale: 0.93 } : {}}
                onClick={() => handleAnswer(answer.id)}
                disabled={!!selectedAnswer}
                className="rounded-2xl flex flex-col items-center justify-center shadow-2xl relative overflow-hidden transition-opacity"
                style={{
                  backgroundColor: isSelected && answerResult && !answerResult.correct
                    ? style.darkBg : style.bg,
                  opacity: selectedAnswer && !isSelected ? 0.45 : 1,
                  outline: isSelected ? '4px solid white' : 'none',
                  outlineOffset: -4,
                  minHeight: 130,
                }}
              >
                {/* Shape icon */}
                <span className="text-white text-5xl font-black mb-2 drop-shadow-lg leading-none">
                  {style.shape}
                </span>
                <span className="text-white font-black text-base text-center px-3 leading-tight">
                  {answer.text}
                </span>
                {isCorrect && answerResult && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center"
                  >
                    <span className="text-green-600 font-black text-sm">✓</span>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </>
  )
}
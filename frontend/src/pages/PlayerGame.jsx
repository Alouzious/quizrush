import { useEffect, useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Zap } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useTimer } from '../hooks/useTimer'
import { useGameStore } from '../store/gameStore'
import { scaleIn, shakeVariant } from '../animations/variants'
import confetti from 'canvas-confetti'

const ANSWER_COLORS = ['bg-[#2563EB]', 'bg-[#F97316]', 'bg-[#10B981]', 'bg-[#8B5CF6]']

export default function PlayerGame() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { nickname, currentQuestion, setCurrentQuestion, setLeaderboard, setGameStatus, score, setScore } = useGameStore()
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answerResult, setAnswerResult] = useState(null)
  const [waiting, setWaiting] = useState(false)
  const { timeLeft, start } = useTimer(20)

  const handleMessage = useCallback((msg) => {
    switch (msg.event) {
      case 'answer_received':
        setAnswerResult(msg.data)
        setWaiting(true)
        if (msg.data.correct) confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
        break
      case 'leaderboard_update':
        setLeaderboard(msg.data.leaderboard)
        break
      case 'next_question':
        setSelectedAnswer(null)
        setAnswerResult(null)
        setWaiting(false)
        setCurrentQuestion(msg.data)
        start(msg.data.timer)
        break
      case 'game_ended':
        setGameStatus('finished')
        setLeaderboard(msg.data.leaderboard)
        navigate(`/results/${roomCode}`)
        break
    }
  }, [navigate, roomCode, setCurrentQuestion, setLeaderboard, setGameStatus, start])

  const { send } = useWebSocket(handleMessage)

  useEffect(() => {
    if (!nickname) { navigate('/join'); return }
    if (currentQuestion) start(currentQuestion.timer || 20)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAnswer = (answerId) => {
    if (selectedAnswer || waiting || !currentQuestion) return
    setSelectedAnswer(answerId)
    send({
      event: 'submit_answer',
      question_id: currentQuestion.question.id,
      answer_id: answerId
    })
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2563EB]">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const question = currentQuestion.question
  const questionNumber = currentQuestion.question_number
  const totalQuestions = currentQuestion.total_questions
  const timerPercent = (timeLeft / (question?.time_limit || 20)) * 100

  return (
    <>
      <Helmet><title>Playing — QuizRush</title></Helmet>
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col">
        {/* Top bar */}
        <div className="bg-[#2563EB] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={20} />
            <span className="font-bold">{nickname}</span>
          </div>
          <div className="text-center">
            <p className="text-blue-200 text-xs">Question</p>
            <p className="font-extrabold text-lg">{questionNumber}/{totalQuestions}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Score</p>
            <p className="font-extrabold text-lg">{score.toLocaleString()}</p>
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-2 bg-gray-200">
          <motion.div
            className="h-full bg-[#F97316] transition-all"
            style={{ width: `${timerPercent}%` }}
            animate={{ width: `${timerPercent}%` }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={question?.id}
              variants={scaleIn}
              initial="initial"
              animate="animate"
              className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-md text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock size={16} className="text-[#F97316]" />
                <span className={`text-2xl font-extrabold ${timeLeft <= 5 ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>{timeLeft}s</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] leading-relaxed">{question?.text}</h2>
            </motion.div>
          </AnimatePresence>

          {/* Answers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
            {question?.answers?.map((answer, idx) => {
              const isSelected = selectedAnswer === answer.id
              const isCorrect = answerResult?.correct_answer_id === answer.id
              const isWrong = isSelected && answerResult && !answerResult.correct

              return (
                <motion.button
                  key={answer.id}
                  variants={isWrong ? shakeVariant : {}}
                  animate={isWrong ? 'shake' : 'idle'}
                  whileHover={!selectedAnswer ? { scale: 1.02 } : {}}
                  whileTap={!selectedAnswer ? { scale: 0.97 } : {}}
                  onClick={() => handleAnswer(answer.id)}
                  disabled={!!selectedAnswer || waiting}
                  className={`p-5 rounded-2xl text-white font-bold text-lg text-left transition-all shadow-md ${ANSWER_COLORS[idx]}
                    ${isSelected && answerResult?.correct ? 'ring-4 ring-[#10B981] ring-offset-2' : ''}
                    ${isWrong ? 'opacity-70' : ''}
                    ${answerResult && isCorrect && !isSelected ? 'ring-4 ring-[#10B981] ring-offset-2' : ''}
                    disabled:cursor-default`}
                >
                  <span className="text-white/70 text-sm mr-2">{String.fromCharCode(65 + idx)}</span>
                  {answer.text}
                </motion.button>
              )
            })}
          </div>

          {/* Answer result popup */}
          <AnimatePresence>
            {answerResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl text-white font-bold text-xl shadow-2xl ${answerResult.correct ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
              >
                {answerResult.correct ? `✓ Correct! +${answerResult.points} pts` : '✗ Wrong!'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

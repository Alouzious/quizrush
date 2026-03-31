import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, ChevronLeft, Save, Clock, Image } from 'lucide-react'
import { quizApi } from '../../services/api'
import { staggerContainer, staggerItem } from '../../animations/variants'

const ANSWER_STYLES = [
  { bg: '#e21b3c', shape: '▲', label: 'A' },
  { bg: '#1368ce', shape: '◆', label: 'B' },
  { bg: '#d89e00', shape: '●', label: 'C' },
  { bg: '#26890c', shape: '■', label: 'D' },
]

const TIMER_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120]

function newQuestion() {
  return {
    text: '',
    time_limit: 20,
    answers: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
  }
}

export default function QuizBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState([newQuestion()])
  const [saving, setSaving] = useState(false)
  const [activeQ, setActiveQ] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isEditing) {
      quizApi.get(id).then(res => {
        const q = res.data.data
        setTitle(q.title)
        setDescription(q.description || '')
        setQuestions(q.questions?.length ? q.questions : [newQuestion()])
      })
    }
  }, [id, isEditing])

  const updateQuestion = (qi, field, value) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qi ? { ...q, [field]: value } : q
    ))
  }

  const updateAnswer = (qi, ai, field, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q
      return {
        ...q,
        answers: q.answers.map((a, j) => {
          if (field === 'is_correct') {
            return { ...a, is_correct: j === ai }
          }
          return j === ai ? { ...a, [field]: value } : a
        })
      }
    }))
  }

  const addAnswer = (qi) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qi && q.answers.length < 6
        ? { ...q, answers: [...q.answers, { text: '', is_correct: false }] }
        : q
    ))
  }

  const removeAnswer = (qi, ai) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qi && q.answers.length > 2
        ? { ...q, answers: q.answers.filter((_, j) => j !== ai) }
        : q
    ))
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, newQuestion()])
    setActiveQ(questions.length)
  }

  const removeQuestion = (qi) => {
    if (questions.length === 1) return
    setQuestions(prev => prev.filter((_, i) => i !== qi))
    setActiveQ(Math.max(0, qi - 1))
  }

  const handleSave = async () => {
    if (!title.trim()) { alert('Please add a quiz title'); return }
    const validQ = questions.filter(q => q.text.trim())
    if (!validQ.length) { alert('Add at least one question'); return }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        questions: validQ.map(q => ({
          text: q.text.trim(),
          time_limit: q.time_limit,
          answers: q.answers.filter(a => a.text.trim()).map(a => ({
            text: a.text.trim(),
            is_correct: a.is_correct,
          })),
        })),
      }
      if (isEditing) {
        await quizApi.update(id, payload)
      } else {
        await quizApi.create(payload)
      }
      setSaved(true)
      setTimeout(() => navigate('/dashboard'), 800)
    } catch {
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const currentQ = questions[activeQ]

  return (
    <>
      <Helmet><title>{isEditing ? 'Edit Quiz' : 'New Quiz'} — QuizRush</title></Helmet>

      <div
        className="min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(160deg, #1a0a2e 0%, #3d1a6e 50%, #6b3fa0 100%)' }}
      >
        {/* TOP BAR */}
        <div
          className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl"
          style={{ background: 'rgba(26,10,46,0.9)' }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-medium"
            >
              <ChevronLeft size={20} />
              Dashboard
            </motion.button>

            <div className="flex items-center gap-3">
              <span className="text-white/40 text-sm hidden sm:block">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(123,47,247,0.5)' }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
                disabled={saving || saved}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black shadow-xl disabled:opacity-60 transition-all"
                style={{ background: saved ? '#26890c' : 'linear-gradient(135deg, #7b2ff7, #5c1a9e)' }}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saved ? (
                  <><Check size={20} /> Saved!</>
                ) : (
                  <><Save size={20} /> Save Quiz</>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* LEFT SIDEBAR — questions list */}
          <div
            className="w-64 flex-shrink-0 border-r border-white/10 flex flex-col overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            {/* Quiz meta */}
            <div className="p-4 border-b border-white/10">
              <input
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-sm placeholder-white/30 outline-none focus:border-purple-400 transition-colors"
                placeholder="Quiz title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <textarea
                className="w-full mt-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white/70 text-xs placeholder-white/30 outline-none focus:border-purple-400 transition-colors resize-none"
                placeholder="Description (optional)"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Question list */}
            <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto">
              {questions.map((q, qi) => (
                <motion.button
                  key={qi}
                  onClick={() => setActiveQ(qi)}
                  whileHover={{ x: 3 }}
                  className="w-full text-left px-3 py-3 rounded-xl transition-all flex items-center gap-3 group"
                  style={{
                    background: activeQ === qi
                      ? 'linear-gradient(135deg, rgba(123,47,247,0.5), rgba(92,26,158,0.5))'
                      : 'rgba(255,255,255,0.05)',
                    border: activeQ === qi ? '1px solid rgba(123,47,247,0.5)' : '1px solid transparent',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                    style={{ background: ANSWER_STYLES[qi % 4].bg }}
                  >
                    {qi + 1}
                  </div>
                  <span className="text-white/70 text-xs truncate flex-1">
                    {q.text || 'Untitled question'}
                  </span>
                  {questions.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); removeQuestion(qi) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </motion.button>
              ))}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={addQuestion}
                className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-white/40 hover:text-white/70 hover:border-white/40 transition-all flex items-center justify-center gap-2 text-sm font-bold mt-1"
              >
                <Plus size={16} />
                Add Question
              </motion.button>
            </div>
          </div>

          {/* MAIN EDITOR */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {currentQ && (
                <motion.div
                  key={activeQ}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  className="p-6 max-w-3xl mx-auto"
                >
                  {/* Question number + timer */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/50 font-bold text-sm uppercase tracking-wider">
                      Question {activeQ + 1} of {questions.length}
                    </span>
                    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                      <Clock size={14} className="text-white/50" />
                      <span className="text-white/50 text-sm">Timer:</span>
                      <select
                        value={currentQ.time_limit}
                        onChange={e => updateQuestion(activeQ, 'time_limit', Number(e.target.value))}
                        className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
                      >
                        {TIMER_OPTIONS.map(t => (
                          <option key={t} value={t} style={{ background: '#3d1a6e' }}>{t}s</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Question input */}
                  <div className="bg-white rounded-2xl shadow-2xl mb-5">
                    <textarea
                      className="w-full px-6 py-5 text-gray-900 font-black text-xl placeholder-gray-300 outline-none resize-none rounded-2xl"
                      placeholder="Start typing your question..."
                      rows={3}
                      value={currentQ.text}
                      onChange={e => updateQuestion(activeQ, 'text', e.target.value)}
                    />
                  </div>

                  {/* Media placeholder */}
                  <div
                    className="rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center py-8 mb-5 cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                      <Image size={24} className="text-white/40" />
                    </div>
                    <p className="text-white/40 font-bold text-sm">Find and insert media</p>
                    <p className="text-white/30 text-xs mt-1">
                      <span className="underline cursor-pointer hover:text-white/50">Upload file</span>
                      {' '}or drag here to upload
                    </p>
                  </div>

                  {/* Answer boxes — 2x2 Kahoot style */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {currentQ.answers.map((answer, ai) => {
                      const style = ANSWER_STYLES[ai] || ANSWER_STYLES[ai % 4]
                      return (
                        <motion.div
                          key={ai}
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: ai * 0.05 }}
                          className="relative rounded-2xl overflow-hidden shadow-xl"
                          style={{ backgroundColor: style.bg }}
                        >
                          {/* Shape icon left strip */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                          >
                            <span className="text-white text-2xl font-black">{style.shape}</span>
                          </div>

                          {/* Input */}
                          <input
                            className="w-full pl-16 pr-14 py-5 bg-transparent text-white font-bold text-base placeholder-white/50 outline-none"
                            placeholder={ai < 2 ? `Add answer ${ai + 1}` : `Add answer ${ai + 1} (optional)`}
                            value={answer.text}
                            onChange={e => updateAnswer(activeQ, ai, 'text', e.target.value)}
                          />

                          {/* Correct toggle */}
                          <button
                            onClick={() => updateAnswer(activeQ, ai, 'is_correct', true)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center transition-all hover:border-white"
                            style={{
                              backgroundColor: answer.is_correct ? 'white' : 'transparent',
                            }}
                          >
                            {answer.is_correct && (
                              <Check size={18} style={{ color: style.bg }} className="font-black" strokeWidth={3} />
                            )}
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Add more answers */}
                  {currentQ.answers.length < 6 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => addAnswer(activeQ)}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 transition-all flex items-center justify-center gap-2 font-bold"
                    >
                      <Plus size={18} />
                      Add more answers
                    </motion.button>
                  )}

                  {/* Hint */}
                  <p className="text-white/30 text-xs text-center mt-4">
                    Click the circle on an answer to mark it as correct
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronLeft, Save, Check } from 'lucide-react'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { quizApi } from '../../services/api'
import { pageVariants } from '../../animations/variants'

function AnswerInput({ answer, index, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange({ ...answer, is_correct: !answer.is_correct })}
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          answer.is_correct ? 'bg-[#10B981] border-[#10B981]' : 'border-gray-300'
        }`}
      >
        {answer.is_correct && <Check size={12} className="text-white" />}
      </button>
      <input
        value={answer.text}
        onChange={e => onChange({ ...answer, text: e.target.value })}
        placeholder={`Answer ${index + 1}`}
        className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none text-sm font-medium"
      />
      <button type="button" onClick={onRemove} className="text-gray-400 hover:text-[#EF4444] transition-colors">
        <Trash2 size={16} />
      </button>
    </div>
  )
}

const newQuestion = (idx) => ({
  text: '',
  time_limit: 20,
  points: 1000,
  order_index: idx,
  answers: [
    { text: '', is_correct: false, order_index: 0 },
    { text: '', is_correct: false, order_index: 1 },
    { text: '', is_correct: false, order_index: 2 },
    { text: '', is_correct: false, order_index: 3 },
  ]
})

export default function QuizBuilder() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState([newQuestion(0)])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isEditing) {
      quizApi.get(id).then(res => {
        const q = res.data.data
        setTitle(q.title)
        setDescription(q.description || '')
        setQuestions(q.questions.length > 0 ? q.questions.map((qs) => ({
          ...qs,
          answers: qs.answers
        })) : [newQuestion(0)])
      })
    }
  }, [id, isEditing])

  const updateQuestion = (idx, data) => {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, ...data } : q))
  }

  const updateAnswer = (qIdx, aIdx, data) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? {
      ...q,
      answers: q.answers.map((a, j) => j === aIdx ? data : a)
    } : q))
  }

  const addQuestion = () => {
    setQuestions(qs => [...qs, newQuestion(qs.length)])
  }

  const removeQuestion = (idx) => {
    if (questions.length <= 1) return
    setQuestions(qs => qs.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (!title.trim()) { alert('Please enter a quiz title'); return }
    setSaving(true)
    try {
      const payload = { title, description, questions }
      if (isEditing) {
        await quizApi.update(id, payload)
      } else {
        await quizApi.create(payload)
      }
      setSaved(true)
      setTimeout(() => { navigate('/dashboard') }, 1000)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Helmet><title>{isEditing ? 'Edit Quiz' : 'New Quiz'} — QuizRush</title></Helmet>
      <motion.div variants={pageVariants} initial="initial" animate="animate" className="min-h-screen bg-[#F7F8FC]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-[#0F172A] transition-colors">
              <ChevronLeft size={20} />
              <span className="font-medium">Dashboard</span>
            </button>
            <Button onClick={handleSave} loading={saving} variant={saved ? 'accent' : 'primary'}>
              {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> {isEditing ? 'Update' : 'Save'} Quiz</>}
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Quiz info */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4">Quiz Details</h2>
            <div className="flex flex-col gap-4">
              <Input label="Quiz Title" placeholder="e.g. Geography Challenge" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#0F172A]">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is this quiz about?"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none font-medium text-[#0F172A] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <AnimatePresence>
            {questions.map((q, qIdx) => (
              <motion.div
                key={qIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#0F172A]">Question {qIdx + 1}</h3>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-500 flex items-center gap-2">
                      Timer:
                      <select
                        value={q.time_limit}
                        onChange={e => updateQuestion(qIdx, { time_limit: parseInt(e.target.value) })}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none"
                      >
                        {[10,15,20,30,45,60].map(t => <option key={t} value={t}>{t}s</option>)}
                      </select>
                    </label>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(qIdx)} className="text-gray-400 hover:text-[#EF4444] transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={q.text}
                  onChange={e => updateQuestion(qIdx, { text: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none font-medium text-[#0F172A] resize-none mb-4"
                />
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 font-medium">Answers (click circle to mark correct):</p>
                  {q.answers.map((a, aIdx) => (
                    <AnswerInput
                      key={aIdx}
                      answer={a}
                      index={aIdx}
                      onChange={data => updateAnswer(qIdx, aIdx, data)}
                      onRemove={() => setQuestions(qs => qs.map((ques, i) => i === qIdx ? { ...ques, answers: ques.answers.filter((_, j) => j !== aIdx) } : ques))}
                    />
                  ))}
                  {q.answers.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setQuestions(qs => qs.map((ques, i) => i === qIdx ? { ...ques, answers: [...ques.answers, { text: '', is_correct: false, order_index: ques.answers.length }] } : ques))}
                      className="flex items-center gap-2 text-[#2563EB] text-sm font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Plus size={14} /> Add Answer
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button variant="outline" className="w-full" onClick={addQuestion}>
            <Plus size={18} /> Add Question
          </Button>
        </div>
      </motion.div>
    </>
  )
}

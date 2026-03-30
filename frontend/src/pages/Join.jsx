import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, ArrowRight } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import { useGameStore } from '../store/gameStore'
import { gameApi } from '../services/api'
import { pageVariants } from '../animations/variants'

const schema = z.object({
  roomCode: z.string().min(6).max(6).toUpperCase(),
  nickname: z.string().min(2).max(30),
})

export default function Join() {
  const navigate = useNavigate()
  const { roomCode: paramCode } = useParams()
  const setPlayer = useGameStore(s => s.setPlayer)
  const setRoomCode = useGameStore(s => s.setRoomCode)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { roomCode: paramCode || '', nickname: '' }
  })

  const onSubmit = async (data) => {
    setError('')
    try {
      const res = await gameApi.getRoom(data.roomCode)
      if (res.data.data.status === 'finished') {
        setError('This game has already ended.')
        return
      }
      setPlayer(null, data.nickname)
      setRoomCode(data.roomCode)
      navigate(`/lobby/${data.roomCode}`)
    } catch {
      setError('Room not found. Check the code and try again.')
    }
  }

  return (
    <>
      <Helmet>
        <title>Join a Game — QuizRush</title>
        <meta name="description" content="Enter your room code and nickname to join a live quiz game." />
      </Helmet>
      <motion.div variants={pageVariants} initial="initial" animate="animate" className="min-h-screen bg-gradient-to-br from-[#2563EB] to-blue-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A]">Join a Game</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Room Code"
              placeholder="ABC123"
              {...register('roomCode')}
              error={errors.roomCode?.message}
              className="text-center text-2xl font-bold tracking-widest uppercase"
            />
            <Input
              label="Your Nickname"
              placeholder="e.g. QuizWizard99"
              {...register('nickname')}
              error={errors.nickname?.message}
            />
            {error && <p className="text-[#EF4444] text-sm font-medium text-center">{error}</p>}
            <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
              Join Game <ArrowRight size={18} />
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Want to host?{' '}
            <button onClick={() => navigate('/register')} className="text-[#2563EB] font-semibold hover:underline">
              Create an account
            </button>
          </p>
        </div>
      </motion.div>
    </>
  )
}

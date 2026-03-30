import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap } from 'lucide-react'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../services/api'
import { pageVariants } from '../../animations/variants'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setError('')
    try {
      const res = await authApi.login(data)
      setAuth(res.data.data.token, res.data.data.user)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <>
      <Helmet>
        <title>Sign In — QuizRush</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <motion.div variants={pageVariants} initial="initial" animate="animate" className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0F172A]">Welcome back</h1>
              <p className="text-gray-500 text-sm">Sign in to your account</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
            <Input label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
            {error && <p className="text-[#EF4444] text-sm font-medium text-center">{error}</p>}
            <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">Sign In</Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            No account?{' '}
            <Link to="/register" className="text-[#2563EB] font-semibold hover:underline">Create one free</Link>
          </p>
        </div>
      </motion.div>
    </>
  )
}

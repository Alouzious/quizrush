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
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setError('')
    try {
      const res = await authApi.register(data)
      setAuth(res.data.data.token, res.data.data.user)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <>
      <Helmet>
        <title>Create Account — QuizRush</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <motion.div variants={pageVariants} initial="initial" animate="animate" className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0F172A]">Create your account</h1>
              <p className="text-gray-500 text-sm">Free forever. No credit card needed.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Full Name" type="text" placeholder="Your name" {...register('name')} error={errors.name?.message} />
            <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
            <Input label="Password" type="password" placeholder="Min 8 characters" {...register('password')} error={errors.password?.message} />
            {error && <p className="text-[#EF4444] text-sm font-medium text-center">{error}</p>}
            <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">Create Account Free</Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2563EB] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </>
  )
}

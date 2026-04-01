import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from './store/authStore'

const Landing = lazy(() => import('./pages/Landing'))
const Join = lazy(() => import('./pages/Join'))
const PlayerLobby = lazy(() => import('./pages/PlayerLobby'))
const PlayerGame = lazy(() => import('./pages/PlayerGame'))
const PlayerResults = lazy(() => import('./pages/PlayerResults'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const QuizBuilder = lazy(() => import('./pages/quiz/QuizBuilder'))
const GameLobby = lazy(() => import('./pages/game/GameLobby'))
const HostGame = lazy(() => import('./pages/game/HostGame'))
const HostResults = lazy(() => import('./pages/game/HostResults'))

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#0F172A] font-semibold">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const token = useAuthStore(state => state.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
}

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: '100dvh' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />
          <Route path="/join" element={<AnimatedPage><Join /></AnimatedPage>} />
          <Route path="/join/:roomCode" element={<AnimatedPage><Join /></AnimatedPage>} />
          <Route path="/lobby/:roomCode" element={<AnimatedPage><PlayerLobby /></AnimatedPage>} />
          <Route path="/game/:roomCode" element={<AnimatedPage><PlayerGame /></AnimatedPage>} />
          <Route path="/results/:roomCode" element={<AnimatedPage><PlayerResults /></AnimatedPage>} />
          {/* Auth */}
          <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
          {/* Host Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><AnimatedPage><Dashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/quiz/new" element={<ProtectedRoute><AnimatedPage><QuizBuilder /></AnimatedPage></ProtectedRoute>} />
          <Route path="/quiz/:id/edit" element={<ProtectedRoute><AnimatedPage><QuizBuilder /></AnimatedPage></ProtectedRoute>} />
          <Route path="/host/lobby/:roomCode" element={<ProtectedRoute><AnimatedPage><GameLobby /></AnimatedPage></ProtectedRoute>} />
          <Route path="/host/game/:roomCode" element={<ProtectedRoute><AnimatedPage><HostGame /></AnimatedPage></ProtectedRoute>} />
          <Route path="/host/results/:gameId" element={<ProtectedRoute><AnimatedPage><HostResults /></AnimatedPage></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

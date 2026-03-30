import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/join" element={<Join />} />
        <Route path="/join/:roomCode" element={<Join />} />
        <Route path="/lobby/:roomCode" element={<PlayerLobby />} />
        <Route path="/game/:roomCode" element={<PlayerGame />} />
        <Route path="/results/:roomCode" element={<PlayerResults />} />
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Host Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/quiz/new" element={<ProtectedRoute><QuizBuilder /></ProtectedRoute>} />
        <Route path="/quiz/:id/edit" element={<ProtectedRoute><QuizBuilder /></ProtectedRoute>} />
        <Route path="/host/lobby/:roomCode" element={<ProtectedRoute><GameLobby /></ProtectedRoute>} />
        <Route path="/host/game/:roomCode" element={<ProtectedRoute><HostGame /></ProtectedRoute>} />
        <Route path="/host/results/:gameId" element={<ProtectedRoute><HostResults /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

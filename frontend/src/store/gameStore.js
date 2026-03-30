import { create } from 'zustand'

export const useGameStore = create((set) => ({
  // Player state
  playerId: null,
  nickname: null,
  roomCode: null,
  players: [],
  currentQuestion: null,
  score: 0,
  lastAnswer: null,
  leaderboard: [],
  gameStatus: 'idle', // idle | waiting | active | finished
  
  setPlayer: (playerId, nickname) => set({ playerId, nickname }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayers: (players) => set({ players }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setScore: (score) => set({ score }),
  setLastAnswer: (lastAnswer) => set({ lastAnswer }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setGameStatus: (gameStatus) => set({ gameStatus }),
  reset: () => set({
    playerId: null, nickname: null, roomCode: null, players: [],
    currentQuestion: null, score: 0, lastAnswer: null,
    leaderboard: [], gameStatus: 'idle'
  }),
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useGameStore = create(
  persist(
    (set) => ({
      playerId: null,
      nickname: null,
      avatarSeed: null,
      roomCode: null,
      gameId: null,
      players: [],
      currentQuestion: null,
      score: 0,
      lastAnswer: null,
      leaderboard: [],
      gameStatus: 'idle',

      setPlayer: (playerId, nickname) => set({ playerId, nickname }),
      setNickname: (nickname) => set({ nickname }),
      setAvatarSeed: (avatarSeed) => set({ avatarSeed }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setGameId: (gameId) => set({ gameId }),
      setPlayers: (players) => set({ players }),
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setScore: (scoreOrUpdater) => set((state) => ({
        score: typeof scoreOrUpdater === 'function'
          ? scoreOrUpdater(state.score)
          : scoreOrUpdater,
      })),
      setLastAnswer: (lastAnswer) => set({ lastAnswer }),
      setLeaderboard: (leaderboard) => set({ leaderboard }),
      setGameStatus: (gameStatus) => set({ gameStatus }),
      reset: () => set({
        playerId: null,
        nickname: null,
        avatarSeed: null,
        roomCode: null,
        gameId: null,
        players: [],
        currentQuestion: null,
        score: 0,
        lastAnswer: null,
        leaderboard: [],
        gameStatus: 'idle',
      }),
    }),
    {
      name: 'quizrush-game',
      partialize: (state) => ({
        nickname: state.nickname,
        avatarSeed: state.avatarSeed,
        roomCode: state.roomCode,
      }),
    }
  )
)
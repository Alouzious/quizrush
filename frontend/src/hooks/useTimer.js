import { useState, useEffect, useRef } from 'react'

export function useTimer(initialTime, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const intervalRef = useRef(null)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  const start = (time) => {
    setTimeLeft(time ?? initialTime)
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stop = () => {
    clearInterval(intervalRef.current)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  return { timeLeft, start, stop }
}

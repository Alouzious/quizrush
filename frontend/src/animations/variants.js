export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0 },
}

export const slideUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export const slideDown = {
  initial: { opacity: 0, y: -60 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

export const staggerItem = {
  initial: { opacity: 0, y: 30, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.7 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 22 } },
}

export const shakeVariant = {
  idle: { x: 0 },
  shake: { x: [0, -12, 12, -10, 10, -6, 6, 0], transition: { duration: 0.5 } },
}

export const popIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
}

export const bounceIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: [0, 1.2, 0.9, 1.05, 1], opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

export const slideInRight = {
  initial: { x: 300, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 28 } },
  exit: { x: 300, opacity: 0, transition: { duration: 0.2 } },
}

export const pulse = {
  animate: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } },
}
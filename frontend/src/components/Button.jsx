import { motion } from 'framer-motion'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white focus:ring-[#2563EB] shadow-lg shadow-blue-500/25',
    secondary: 'bg-[#F97316] hover:bg-[#ea6c0a] text-white focus:ring-[#F97316] shadow-lg shadow-orange-500/25',
    accent: 'bg-[#10B981] hover:bg-[#059669] text-white focus:ring-[#10B981] shadow-lg shadow-emerald-500/25',
    danger: 'bg-[#EF4444] hover:bg-[#dc2626] text-white focus:ring-[#EF4444] shadow-lg shadow-red-500/25',
    outline: 'border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white focus:ring-[#2563EB]',
    ghost: 'text-[#0F172A] hover:bg-gray-100 focus:ring-gray-200',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : children}
    </motion.button>
  )
}

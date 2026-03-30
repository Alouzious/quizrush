export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[#0F172A]">{label}</label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-xl border-2 font-medium text-[#0F172A] bg-white placeholder:text-gray-400 focus:outline-none focus:border-[#2563EB] transition-colors ${
          error ? 'border-[#EF4444]' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-[#EF4444] font-medium">{error}</p>}
    </div>
  )
}

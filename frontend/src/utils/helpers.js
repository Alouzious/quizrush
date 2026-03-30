export function generateAvatar(nickname) {
  const colors = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4']
  let hash = 0
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function formatScore(score) {
  return score.toLocaleString()
}

export function getRankEmoji(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function escapeCsvValue(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToCsv(data, filename) {
  const headers = Object.keys(data[0]).map(escapeCsvValue).join(',')
  const rows = data.map(row => Object.values(row).map(escapeCsvValue).join(',')).join('\n')
  const csv = `${headers}\n${rows}`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

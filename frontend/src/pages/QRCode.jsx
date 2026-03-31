/**
 * QRCode.jsx
 * A real, scannable QR code component using the 'qrcode' npm package.
 *
 * INSTALL:  npm install qrcode
 *
 * USAGE:
 *   import QRCodeDisplay from './QRCode'
 *   <QRCodeDisplay value="https://quizrush.app/join" size={140} dark="#0f0f0f" light="#ffffff" />
 */

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QRCodeDisplay({
  value,
  size = 140,
  dark = '#0f0f0f',
  light = '#ffffff',
  className,
  style,
}) {
  const [svgContent, setSvgContent] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!value) return
    QRCode.toString(value, {
      type: 'svg',
      width: size,
      margin: 1,
      color: { dark, light },
      errorCorrectionLevel: 'H', // highest — survives logo overlays and damage
    })
      .then(setSvgContent)
      .catch(setError)
  }, [value, size, dark, light])

  if (error) return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee', borderRadius: 8, fontSize: 11, color: '#c00', textAlign: 'center', padding: 8 }}>
      QR error
    </div>
  )

  if (!svgContent) return (
    <div style={{ width: size, height: size, background: '#f0f0f0', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
  )

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
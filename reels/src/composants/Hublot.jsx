import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { bruit } from '../anim.js'

// La cabine : un hublot sur le ciel du couchant, le dossier d'un siège, quelques étoiles de poussière.
export const Cabine = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #3c3345 0%, #2b2230 58%, #201a23 100%)' }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="hb-ciel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#aaa6f2" />
            <stop offset="0.55" stopColor="#c9c7f7" />
            <stop offset="1" stopColor="#e7e4fb" />
          </linearGradient>
          <clipPath id="hb-verre"><ellipse cx="90" cy="800" rx="240" ry="340" /></clipPath>
        </defs>
        {[...Array(44)].map((_, i) => (
          <circle key={i} cx={bruit(i) * 1080} cy={bruit(i + 50) * 1500} r={1.5 + bruit(i + 90) * 2.5} fill="#e9e3ff" opacity={0.12 + 0.18 * (0.5 + 0.5 * Math.sin(frame / 25 + i))} />
        ))}
        {/* le hublot */}
        <ellipse cx="90" cy="800" rx="290" ry="395" fill="#4a3f57" opacity="0.85" />
        <ellipse cx="90" cy="800" rx="262" ry="366" fill="#5a4e69" opacity="0.9" />
        <g clipPath="url(#hb-verre)">
          <rect x="-200" y="400" width="600" height="800" fill="url(#hb-ciel)" />
          <circle cx="75" cy="812" r="46" fill="#eba319" />
          <ellipse cx="-30" cy="1010" rx="150" ry="42" fill="#ffffff" opacity="0.5" />
        </g>
        <ellipse cx="90" cy="800" rx="240" ry="340" fill="none" stroke="#7d6f92" strokeWidth="10" opacity="0.7" />
        {/* le dossier du siège, derrière le téléphone */}
        <path d="M560 1930 V1480 q0 -150 150 -150 h240 q150 0 150 150 V1930 z" fill="#352c3e" opacity="0.9" />
        <path d="M600 1930 V1500 q0 -110 110 -110 h200 q110 0 110 110 V1930 z" fill="#3c3246" opacity="0.8" />
      </svg>
    </AbsoluteFill>
  )
}

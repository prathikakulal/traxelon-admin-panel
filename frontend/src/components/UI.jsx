// src/components/UI.jsx
import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { P } from '../styles/theme.js'

export function SBadge({ status }) {
  const map = {
    pending:         [P.yellow, 'rgba(245,158,11,.12)'],
    approved:        [P.cyan,   'rgba(0,212,255,.12)'],
    rejected:        [P.red,    'rgba(255,59,48,.12)'],
    active:          [P.green,  'rgba(52,211,153,.12)'],
    inactive:        [P.muted,  'rgba(74,90,128,.12)'],
    used:            [P.muted,  'rgba(74,90,128,.12)'],
    valid:           [P.green,  'rgba(52,211,153,.12)'],
    expired:         [P.red,    'rgba(255,59,48,.12)'],
    login:           [P.green,  'rgba(52,211,153,.12)'],
    logout:          [P.red,    'rgba(255,59,48,.12)'],
    paid:            [P.green,  'rgba(52,211,153,.12)'],
    pending_payment: [P.yellow, 'rgba(245,158,11,.12)'],
  }
  const [c, b] = map[status] || map.pending
  return (
    <span style={{
      color: c, background: b, border: `1px solid ${c}35`,
      padding: '2px 9px', borderRadius: 4, fontSize: 10,
      fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
      letterSpacing: 1, textTransform: 'uppercase',
    }}>
      {status.replace('_', ' ')}
    </span>
  )
}

export function Toast({ msg, ok, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: ok ? 'rgba(52,211,153,.15)' : 'rgba(255,59,48,.15)',
      border: `1px solid ${ok ? P.green : P.red}`,
      borderRadius: 10, padding: '12px 18px',
      color: ok ? P.green : P.red,
      fontFamily: "'DM Sans',sans-serif", fontSize: 13,
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,.5)',
    }}>
      {ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {msg}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, color = P.cyan }) {
  return (
    <div className="atc" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 28, fontFamily: "'Bebas Neue',cursive", color: color, letterSpacing: 1, lineHeight: 1.3 }}>{value}</div>
      </div>
    </div>
  )
}

export function fmt(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
}

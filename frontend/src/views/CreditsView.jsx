// src/views/CreditsView.jsx
import { useState } from 'react'
import { Search, Zap, Plus, Minus } from 'lucide-react'
import { P } from '../styles/theme.js'

export default function CreditsView({ officers, onAddCredit, onDeductCredit }) {
  const [q, setQ]       = useState('')
  const [bulk, setBulk] = useState('')
  const [amt, setAmt]   = useState({})

  const approved = officers.filter(o => o.status === 'approved' && !o.isAdmin).filter(o =>
    (o.displayName || '').toLowerCase().includes(q.toLowerCase()) ||
    (o.email || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="atc" style={{ padding: 20 }}>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: P.txt, letterSpacing: 1, marginBottom: 12 }}>
          BULK GRANT <span style={{ color: P.cyan }}>CREDITS</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number" min="1"
            placeholder="Credits to add to ALL approved officers"
            value={bulk} onChange={e => setBulk(e.target.value)}
            className="ati" style={{ width: 300 }}
          />
          <button className="abtn abtn-p" onClick={() => {
            const n = parseInt(bulk)
            if (!n || n < 1) return
            approved.forEach(o => onAddCredit(o.uid, n))
            setBulk('')
          }}>
            <Zap size={14} /> Grant to All ({approved.length})
          </button>
        </div>
      </div>

      <div className="atc" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}` }}>
          <div style={{ position: 'relative', maxWidth: 300 }}>
            <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter officers…" className="ati" style={{ paddingLeft: 32, width: '100%' }} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                {['Officer', 'Email', 'Credits', 'Add Amount', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approved.map(o => (
                <tr key={o.uid} className="atr" style={{ borderBottom: `1px solid ${P.border}18` }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: P.txt }}>{o.displayName || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{o.email}</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, color: P.cyan, fontWeight: 700 }}>{o.credits ?? 0}</span></td>
                  <td style={{ padding: '12px 14px' }}>
                    <input type="number" min="1" placeholder="Amt" value={amt[o.uid] || ''} onChange={e => setAmt(p => ({ ...p, [o.uid]: e.target.value }))} className="ati" style={{ width: 72, padding: '5px 8px' }} />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="abtn abtn-p" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => { onAddCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Plus size={12} /> Add</button>
                      <button className="abtn abtn-r" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => onDeductCredit(o.uid)}><Minus size={12} /> −1</button>
                    </div>
                  </td>
                </tr>
              ))}
              {approved.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No approved officers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

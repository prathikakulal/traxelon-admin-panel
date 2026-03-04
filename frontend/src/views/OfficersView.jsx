// src/views/OfficersView.jsx
import { useState } from 'react'
import { Search, CheckCircle2, XCircle, Plus, Minus, Trash2 } from 'lucide-react'
import { SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

export default function OfficersView({ officers, onApprove, onReject, onAddCredit, onDeductCredit, onDelete }) {
  const [q, setQ]     = useState('')
  const [amt, setAmt] = useState({})

  const rows = officers.filter(o =>
    (o.displayName || '').toLowerCase().includes(q.toLowerCase()) ||
    (o.email || '').toLowerCase().includes(q.toLowerCase()) ||
    (o.badgeId || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="atc" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search officers…" className="ati" style={{ paddingLeft: 32, width: '100%' }} />
        </div>
        <span style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{rows.length} results</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${P.border}` }}>
              {['Officer', 'Badge ID', 'Status', 'Credits', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.uid} className="atr" style={{ borderBottom: `1px solid ${P.border}18` }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: `${P.cyanD}20`, border: `1px solid ${P.cyan}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: P.cyan,
                    }}>
                      {(o.displayName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: P.txt }}>{o.displayName || '—'}</div>
                      <div style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{o.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.txt2 }}>{o.badgeId || '—'}</td>
                <td style={{ padding: '12px 14px' }}><SBadge status={o.status || 'pending'} /></td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: P.cyan, fontWeight: 700, minWidth: 24 }}>{o.credits ?? 0}</span>
                    <input
                      type="number" min="1" placeholder="n"
                      value={amt[o.uid] || ''}
                      onChange={e => setAmt(p => ({ ...p, [o.uid]: e.target.value }))}
                      className="ati" style={{ width: 48, padding: '4px 7px', fontSize: 12 }}
                    />
                    <button className="aib" style={{ color: P.green }} onClick={() => { onAddCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Plus size={12} /></button>
                    <button className="aib" style={{ color: P.red }} onClick={() => onDeductCredit(o.uid)}><Minus size={12} /></button>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.muted }}>
                  {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-IN') : '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {o.status === 'pending' && <>
                      <button className="abtn abtn-p" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onApprove(o.uid)}><CheckCircle2 size={11} /> Approve</button>
                      <button className="abtn abtn-r" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onReject(o.uid)}><XCircle size={11} /> Reject</button>
                    </>}
                    {o.status === 'approved' && <button className="abtn abtn-y" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onReject(o.uid)}><XCircle size={11} /> Revoke</button>}
                    {o.status === 'rejected' && <button className="abtn abtn-p" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onApprove(o.uid)}><CheckCircle2 size={11} /> Re-approve</button>}
                    <button className="aib" style={{ color: P.red }} onClick={() => onDelete(o.uid)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: P.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>No officers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

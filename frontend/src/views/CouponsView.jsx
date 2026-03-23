// src/views/CouponsView.jsx
import { useState, useEffect } from 'react'
import { Ticket, RefreshCw, Plus, XCircle, Trash2, CheckCircle2, Copy } from 'lucide-react'
import { db } from '../firebase/config.js'
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore'
import { SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

export default function CouponsView({ showToast }) {
  const [coupons, setCoupons] = useState([])
  const [code, setCode]       = useState('')
  const [credits, setCredits] = useState('')
  const [expiry, setExpiry]   = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(null)
  const [limitCount, setLimitCount] = useState(10)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'coupons'), orderBy('createdAt', 'desc'), limit(limitCount)),
      snap => setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('coupons:', err.message)
    )
    return unsub
  }, [limitCount])

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return 'TRX-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const handleCreate = async () => {
    if (!code.trim() || !credits || parseInt(credits) < 1) { showToast('Enter a valid code and credit amount', false); return }
    setLoading(true)
    try {
      await addDoc(collection(db, 'coupons'), {
        code: code.trim().toUpperCase(), credits: parseInt(credits),
        maxUses: maxUses ? parseInt(maxUses) : 999, usedCount: 0, usedBy: [],
        expiresAt: expiry ? new Date(expiry) : null, active: true, createdAt: serverTimestamp(),
      })
      setCode(''); setCredits(''); setExpiry(''); setMaxUses('')
      showToast('Coupon created successfully ✓')
    } catch (e) { showToast(e.message, false) }
    setLoading(false)
  }

  const handleDeactivate = async (id) => {
    try { await updateDoc(doc(db, 'coupons', id), { active: false }); showToast('Coupon deactivated') }
    catch (e) { showToast(e.message, false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon permanently?')) return
    try { await deleteDoc(doc(db, 'coupons', id)); showToast('Coupon deleted') }
    catch (e) { showToast(e.message, false) }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const getCouponStatus = (c) => {
    if (!c.active) return 'inactive'
    if (c.expiresAt && new Date(c.expiresAt.toDate ? c.expiresAt.toDate() : c.expiresAt) < new Date()) return 'expired'
    if (c.usedCount >= c.maxUses) return 'used'
    return 'valid'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="atc" style={{ padding: 22 }}>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: P.txt, letterSpacing: 1, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ticket size={18} color={P.cyan} />
          CREATE <span style={{ color: P.cyan }}>COUPON</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Coupon Code</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="TRX-XXXXXXXX" className="ati" style={{ flex: 1 }} />
              <button className="abtn abtn-g" style={{ padding: '8px 10px' }} onClick={() => setCode(generateCode())} title="Auto-generate"><RefreshCw size={13} /></button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Credits Value</div>
            <input type="number" min="1" value={credits} onChange={e => setCredits(e.target.value)} placeholder="e.g. 5" className="ati" style={{ width: '100%' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Max Uses (optional)</div>
            <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Unlimited" className="ati" style={{ width: '100%' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Expiry Date (optional)</div>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="ati" style={{ width: '100%', colorScheme: 'dark' }} />
          </div>
        </div>
        <button className="abtn abtn-p" onClick={handleCreate} disabled={loading}>
          <Plus size={14} /> {loading ? 'Creating…' : 'Create Coupon'}
        </button>
      </div>

      <div className="atc" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: P.txt, letterSpacing: 1 }}>ALL COUPONS</span>
          <span style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{coupons.length} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                {['Code', 'Credits', 'Used / Max', 'Status', 'Expires', 'Used By', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const status = getCouponStatus(c)
                return (
                  <tr key={c.id} className="atr" style={{ borderBottom: `1px solid ${P.border}18` }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: P.cyan, fontWeight: 700 }}>{c.code}</span>
                        <button className="aib" onClick={() => handleCopy(c.code)} title="Copy" style={{ color: copied === c.code ? P.green : P.muted }}>
                          {copied === c.code ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: P.yellow, fontWeight: 700 }}>{c.credits}</span>
                      <span style={{ fontSize: 10, color: P.muted, marginLeft: 4 }}>cr</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.txt2 }}>
                      {c.usedCount || 0} / {c.maxUses >= 999 ? '∞' : c.maxUses}
                    </td>
                    <td style={{ padding: '12px 14px' }}><SBadge status={status} /></td>
                    <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.muted }}>
                      {c.expiresAt ? (c.expiresAt.toDate ? c.expiresAt.toDate().toLocaleDateString('en-IN') : new Date(c.expiresAt).toLocaleDateString('en-IN')) : 'Never'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.usedBy?.length > 0 ? (
                        <div style={{ maxWidth: 160 }}>
                          {c.usedBy.slice(0, 2).map((u, i) => (
                            <div key={i} style={{ fontSize: 10, color: P.txt2, fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || u.uid}</div>
                          ))}
                          {c.usedBy.length > 2 && <div style={{ fontSize: 10, color: P.muted }}>+{c.usedBy.length - 2} more</div>}
                        </div>
                      ) : <span style={{ fontSize: 11, color: P.muted }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.muted }}>
                      {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {c.active && <button className="abtn abtn-y" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleDeactivate(c.id)}><XCircle size={11} /> Disable</button>}
                        <button className="aib" style={{ color: P.red }} onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {coupons.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No coupons yet. Create your first one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {coupons.length >= limitCount && (
          <div style={{ padding: '14px', textAlign: 'center', borderTop: `1px solid ${P.border}` }}>
            <button className="abtn abtn-g" onClick={() => setLimitCount(l => l + 10)}>
              Load More Coupons
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

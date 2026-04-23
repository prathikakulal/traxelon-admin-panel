// frontend/src/views/VouchersView.jsx
import { useState, useEffect, useCallback } from 'react'
import { Ticket, Plus, Trash2, RefreshCw, Copy, CheckCircle2 } from 'lucide-react'
import { SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'
import { fetchWithAuth } from '../utils/api.js'

function randomSegment(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function randomPreview(prefix, middleName, suffix) {
  const rand = randomSegment(6)
  return [prefix, middleName, rand, suffix].filter(Boolean).map(s => s.toUpperCase()).join('-') || rand
}

function getVoucherStatus(v) {
  if (v.redeemed) return 'used'
  const now = new Date()
  const end = new Date(v.endDate); end.setHours(23, 59, 59, 999)
  if (now < new Date(v.startDate)) return 'inactive'
  if (now > end) return 'expired'
  return 'valid'
}

const EMPTY = {
  prefix: '', middleName: '', suffix: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '', credits: 1,
}

export default function VouchersView({ showToast }) {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(EMPTY)
  const [preview, setPreview]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied]     = useState(null)

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchVouchers = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true)
    try {
      const data = await fetchWithAuth('/api/admin/vouchers')
      setVouchers(data.vouchers || [])
    } catch (err) {
      showToast(err.message || 'Failed to load vouchers', false)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchVouchers(true) }, [fetchVouchers])

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value }
    setForm(updated)
    setPreview(randomPreview(updated.prefix, updated.middleName, updated.suffix))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (Number(form.credits) < 1) { showToast('Minimum credits is 1', false); return }
    if (!form.endDate) { showToast('End date is required', false); return }
    setSubmitting(true)
    try {
      const data = await fetchWithAuth('/api/admin/vouchers', {
        method: 'POST',
        body: JSON.stringify({ ...form, credits: Number(form.credits) }),
      })
      showToast(`Voucher ${data.code} created ✓`)
      setForm(EMPTY)
      setPreview('')
      fetchVouchers()
    } catch (err) {
      showToast(err.message, false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete voucher ${v.code}? This cannot be undone.`)) return
    try {
      await fetchWithAuth(`/api/admin/vouchers/${v.id}`, { method: 'DELETE' })
      showToast('Voucher deleted.')
      fetchVouchers()
    } catch (err) {
      showToast(err.message, false)
    }
  }

  const handleCopy = (id, code) => {
    navigator.clipboard.writeText(code)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Create Form ── */}
      <div className="atc" style={{ padding: 22 }}>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: P.txt, letterSpacing: 1, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ticket size={18} color={P.cyan} />
          CREATE <span style={{ color: P.cyan }}>VOUCHER</span>
        </div>

        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 12 }}>
            {[
              { name: 'prefix',     label: 'Prefix',      placeholder: 'e.g. TRX' },
              { name: 'middleName', label: 'Middle Name',  placeholder: 'e.g. SUMMER' },
              { name: 'suffix',     label: 'Suffix',       placeholder: 'e.g. 2025' },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
                <input
                  name={name} value={form[name]} onChange={handleChange}
                  placeholder={placeholder} maxLength={12}
                  className="ati" style={{ width: '100%', textTransform: 'uppercase' }}
                />
              </div>
            ))}
          </div>

          {preview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: `${P.cyan}0d`, border: `1px solid ${P.cyan}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
              <Ticket size={14} color={P.cyan} />
              <span style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>Preview:</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: P.cyan, letterSpacing: 3, flex: 1 }}>{preview}</span>
              <button type="button" onClick={() => setPreview(randomPreview(form.prefix, form.middleName, form.suffix))}
                className="abtn abtn-g" style={{ padding: '4px 10px', fontSize: 11 }}>
                <RefreshCw size={11} /> Re-roll
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Start Date</div>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required
                className="ati" style={{ width: '100%', colorScheme: 'dark' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>End Date</div>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required
                className="ati" style={{ width: '100%', colorScheme: 'dark' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Credits (min 1)</div>
              <input type="number" name="credits" value={form.credits} onChange={handleChange} min={1} required
                className="ati" style={{ width: '100%' }} />
            </div>
          </div>

          <button type="submit" className="abtn abtn-p" disabled={submitting}>
            <Plus size={14} /> {submitting ? 'Generating…' : 'Generate Voucher'}
          </button>
        </form>
      </div>

      {/* ── Vouchers Table ── */}
      <div className="atc" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: P.txt, letterSpacing: 1 }}>ALL VOUCHERS</span>
            <span style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{vouchers.length} total</span>
          </div>
          <button className="abtn abtn-g" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => fetchVouchers(false)} disabled={loading}>
            <RefreshCw size={11} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {loading && vouchers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            Loading vouchers…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                  {['Status', 'Code', 'Credits', 'Valid From', 'Valid Until', 'Redeemed By', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vouchers.map(v => (
                  <tr key={v.id} className="atr" style={{ borderBottom: `1px solid ${P.border}18` }}>
                    <td style={{ padding: '12px 14px' }}><SBadge status={getVoucherStatus(v)} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: P.cyan, fontWeight: 700, letterSpacing: 2 }}>{v.code}</span>
                        <button className="aib" onClick={() => handleCopy(v.id, v.code)}
                          style={{ color: copied === v.id ? P.green : P.muted }}>
                          {copied === v.id ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: P.yellow, fontWeight: 700 }}>{v.credits}</span>
                      <span style={{ fontSize: 10, color: P.muted, marginLeft: 4 }}>cr</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.txt2 }}>{v.startDate}</td>
                    <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.txt2 }}>{v.endDate}</td>
                    <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.muted }}>
                      {v.redeemed ? (v.redeemedBy || '—') : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button className="aib" style={{ color: P.red }} onClick={() => handleDelete(v)}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                      No vouchers yet. Create your first one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
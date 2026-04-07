// src/views/PaymentsView.jsx
import { useState, useEffect } from 'react'
import { CreditCard, Search, Zap, CheckCircle2, Plus, Clock, Trash2 } from 'lucide-react'
import { db } from '../firebase/config.js'
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, addDoc, serverTimestamp, increment, limit } from 'firebase/firestore'
import { StatCard, SBadge, fmt } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

export default function PaymentsView({ showToast, officers }) {
  const [payments, setPayments] = useState([])
  const [q, setQ]               = useState('')
  const [form, setForm]         = useState({ officerEmail: '', amount: '', credits: '', note: '', txId: '' })
  const [limitCount, setLimitCount] = useState(20)

  useEffect(() => {
    const u1 = onSnapshot(
      query(collection(db, 'payments'), orderBy('paidAt', 'desc'), limit(limitCount)),
      snap => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('payments:', err.message)
    )
    return () => u1()
  }, [limitCount])

  const handleAddPayment = async () => {
    if (!form.officerEmail || !form.amount || !form.credits) { showToast('Fill in officer email, amount and credits', false); return }
    try {
      const officer = officers.find(o => o.email === form.officerEmail)
      await addDoc(collection(db, 'payments'), {
        officerEmail: form.officerEmail, officerName: officer?.displayName || 'Unknown',
        officerUid: officer?.uid || null, amount: parseFloat(form.amount),
        credits: parseInt(form.credits), txId: form.txId || 'MANUAL',
        note: form.note || '', status: 'paid', paidAt: serverTimestamp(),
      })
      if (officer?.uid) {
        await updateDoc(doc(db, 'users', officer.uid), { credits: increment(parseInt(form.credits)) })
      }
      setForm({ officerEmail: '', amount: '', credits: '', note: '', txId: '' })
      showToast('Payment recorded & credits added ✓')
    } catch (e) { showToast(e.message, false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record permanently?')) return
    try {
      await deleteDoc(doc(db, 'payments', id))
      showToast('Payment deleted')
    } catch (e) { showToast(e.message, false) }
  }

  const filtered = payments.filter(p =>
    !q || (p.officerEmail || '').toLowerCase().includes(q.toLowerCase()) || (p.officerName || '').toLowerCase().includes(q.toLowerCase())
  )
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <StatCard icon={CreditCard}   label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} color={P.green} />
        <StatCard icon={CheckCircle2} label="Paid Payments"  value={payments.filter(p => p.status === 'paid').length} color={P.cyan} />
        <StatCard icon={Zap}          label="Credits Sold"   value={payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.credits || 0), 0)} color={P.yellow} />
      </div>

      <div className="atc" style={{ padding: 22 }}>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: P.txt, letterSpacing: 1, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard size={18} color={P.green} />
          RECORD <span style={{ color: P.green }}>PAYMENT</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 14 }}>
          {[
            ['Officer Email',    'officerEmail', 'text',   'officer@police.gov.in'],
            ['Amount Paid (₹)',  'amount',       'number', 'e.g. 499'],
            ['Credits to Grant', 'credits',      'number', 'e.g. 10'],
            ['Transaction ID',   'txId',         'text',   'UPI/Bank Ref (optional)'],
            ['Note (optional)',  'note',         'text',   'e.g. UPI payment'],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
              <input
                list={key === 'officerEmail' ? 'officer-emails' : undefined}
                type={type} value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={ph} className="ati" style={{ width: '100%' }}
              />
              {key === 'officerEmail' && (
                <datalist id="officer-emails">
                  {officers.map(o => <option key={o.uid} value={o.email} />)}
                </datalist>
              )}
            </div>
          ))}
        </div>
        <button className="abtn abtn-gr" onClick={handleAddPayment}><Plus size={14} /> Record Payment & Add Credits</button>
      </div>

      <div className="atc" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by officer…" className="ati" style={{ paddingLeft: 32, width: '100%' }} />
          </div>
          <span style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace", marginLeft: 'auto' }}>{filtered.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                {['Officer', 'Email', 'Amount', 'Credits', 'Tx ID', 'Note', 'Status', 'Date & Time', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="atr" style={{ borderBottom: `1px solid ${P.border}18` }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: P.txt }}>{p.officerName || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{p.officerEmail || '—'}</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: P.green, fontWeight: 700 }}>₹{(p.amount || 0).toLocaleString('en-IN')}</span></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Zap size={11} color={P.yellow} />
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: P.yellow, fontWeight: 700 }}>{p.credits || 0}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.txt2 }}>{p.txId || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: P.txt2 }}>{p.note || '—'}</td>
                  <td style={{ padding: '12px 14px' }}><SBadge status={p.status || 'paid'} /></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={11} color={P.muted} />
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.txt2 }}>{fmt(p.paidAt)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      className="aib"
                      style={{ color: P.red }}
                      title="Delete payment"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No payment records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {payments.length >= limitCount && (
          <div style={{ padding: '14px', textAlign: 'center', borderTop: `1px solid ${P.border}` }}>
            <button className="abtn abtn-g" onClick={() => setLimitCount(l => l + 10)}>
              Load More Payments
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
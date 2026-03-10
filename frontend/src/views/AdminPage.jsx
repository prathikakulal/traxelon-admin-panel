
// src/views/AdminPage.jsx
//hello bendekai
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Link2, Shield, CheckCircle2,
  Zap, RefreshCw, LogOut, Menu, X, AlertTriangle, Bell,
  Ticket, Activity, CreditCard,
} from 'lucide-react'
import { db, auth } from '../firebase/config.js'
import {
  doc, updateDoc, deleteDoc, increment,
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
import { Toast } from '../components/UI.jsx'
import AdminLoginView from '../components/AdminLoginView.jsx'
import OverviewView from './OverviewView.jsx'
import OfficersView from './OfficersView.jsx'
import LinksView from './LinksView.jsx'
import CreditsView from './CreditsView.jsx'
import CouponsView from './CouponsView.jsx'
import ActivityView from './ActivityView.jsx'
import PaymentsView from './PaymentsView.jsx'
import { P, STYLES } from '../styles/theme.js'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'officers', label: 'Officers', icon: Users },
  { id: 'links', label: 'Tracking Links', icon: Link2 },
  { id: 'credits', label: 'Credits', icon: Zap },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'activity', label: 'Activity Log', icon: Activity },
  { id: 'payments', label: 'Payments', icon: CreditCard },
]

export default function AdminPage() {
  const navigate = useNavigate()

  const [authed, setAuthed] = useState(() => sessionStorage.getItem('adminAuthed') === 'true')
  const [adminProfile, setAdminProfile] = useState(() => { try { return JSON.parse(sessionStorage.getItem('adminProfile')) || null } catch { return null } })
  const [tab, setTab] = useState('overview')
  const [sideOpen, setSideOpen] = useState(window.innerWidth > 768)
  const [officers, setOfficers] = useState([])
  const [links, setLinks] = useState([])
  const [toast, setToast] = useState(null)
  const [clock, setClock] = useState(new Date())
  const [fetchError, setFetchError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Fetch data from backend API (Admin SDK — bypasses Firestore rules) ──
  const fetchData = useCallback(async () => {
    if (!authed) return
    setLoading(true)
    try {
      const [usersRes, linksRes] = await Promise.all([
        fetch(`${API}/api/admin/users`),
        fetch(`${API}/api/admin/links`),
      ])
      if (!usersRes.ok) throw new Error(`Users fetch failed: ${usersRes.status} ${usersRes.statusText}`)
      if (!linksRes.ok) throw new Error(`Links fetch failed: ${linksRes.status} ${linksRes.statusText}`)
      const [usersData, linksData] = await Promise.all([usersRes.json(), linksRes.json()])
      setOfficers(usersData)
      setLinks(linksData)
      setFetchError(null)
    } catch (err) {
      console.error('Data fetch error:', err.message)
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }, [authed])

  // Initial fetch on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const showToast = (msg, ok = true) => setToast({ msg, ok })

  const handleApprove = async (uid) => {
    try {
      const o = officers.find(x => x.uid === uid)
      const upd = { status: 'approved' }
      if (!o?.creditGranted) { upd.credits = (o?.credits || 0) + 1; upd.creditGranted = true }
      await updateDoc(doc(db, 'users', uid), upd)
      showToast(o?.creditGranted ? 'Officer re-approved' : 'Approved — 1 free credit granted ✓')
    } catch (e) { showToast(e.message, false) }
  }

  const handleReject = async (uid) => {
    try { await updateDoc(doc(db, 'users', uid), { status: 'rejected' }); showToast('Access revoked') }
    catch (e) { showToast(e.message, false) }
  }

  const handleAddCredit = async (uid, amount) => {
    if (!amount || amount < 1) return
    try { await updateDoc(doc(db, 'users', uid), { credits: increment(amount) }); showToast(`+${amount} credit${amount > 1 ? 's' : ''} added`) }
    catch (e) { showToast(e.message, false) }
  }

  const handleDeductCredit = async (uid, amount = 1) => {
    const o = officers.find(x => x.uid === uid)
    if ((o?.credits || 0) < amount) { showToast('Not enough credits to deduct', false); return }
    try { await updateDoc(doc(db, 'users', uid), { credits: increment(-amount) }); showToast(`−${amount} credit${amount > 1 ? 's' : ''} deducted`) }
    catch (e) { showToast(e.message, false) }
  }

  const handleDelete = async (uid) => {
    if (!window.confirm('Permanently delete this officer?')) return
    try { await deleteDoc(doc(db, 'users', uid)); showToast('Officer deleted') }
    catch (e) { showToast(e.message, false) }
  }

  const handleLogout = async () => {
    try { await auth.signOut() } catch (e) { }
    sessionStorage.removeItem('adminAuthed')
    sessionStorage.removeItem('adminProfile')
    setAdminProfile(null)
    setAuthed(false)
    setOfficers([])
    setLinks([])
  }

  const pending = officers.filter(o => o.status === 'pending').length

  // ── Inject global styles ──
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = STYLES
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  if (!authed) {
    return (
      <AdminLoginView onLoginSuccess={(profile) => {
        sessionStorage.setItem('adminAuthed', 'true')
        sessionStorage.setItem('adminProfile', JSON.stringify(profile))
        setAdminProfile(profile)
        setAuthed(true)
      }} />
    )
  }

  const views = {
    overview: <OverviewView officers={officers} links={links} setTab={setTab} />,
    officers: <OfficersView officers={officers} onApprove={handleApprove} onReject={handleReject} onAddCredit={handleAddCredit} onDeductCredit={handleDeductCredit} onDelete={handleDelete} />,
    links: <LinksView links={links} />,
    credits: <CreditsView officers={officers} onAddCredit={handleAddCredit} onDeductCredit={handleDeductCredit} onDelete={handleDelete} />,
    coupons: <CouponsView showToast={showToast} />,
    activity: <ActivityView />,
    payments: <PaymentsView showToast={showToast} officers={officers} />,
  }

  return (
    <>
      <div className="ascan" />
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      <div className="layout-wrapper" style={{
        background: P.bg,
        backgroundImage: 'linear-gradient(rgba(0,212,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.02) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }}>

        {/* MOBILE OVERLAY */}
        <div className={`mobile-overlay ${sideOpen ? 'open' : ''}`} onClick={() => setSideOpen(false)}></div>

        {/* SIDEBAR */}
        <aside className={`sidebar ${sideOpen ? 'open' : 'closed'}`} style={{
          background: P.surf, borderRight: `1px solid ${P.border}`
        }}>
          <div style={{ padding: '18px 14px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg,${P.cyan},${P.cyanD})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(0,212,255,.35)',
            }}>
              <img src="/favicon.svg" alt="Logo" style={{ width: 20, height: 20 }} />
            </div>
            {sideOpen && <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 19, color: P.txt, letterSpacing: 2, whiteSpace: 'nowrap' }}>TRAXELON</span>}
          </div>

          {sideOpen && (
            <div style={{ margin: '10px 10px 4px', padding: '5px 10px', background: 'rgba(255,59,48,.07)', border: '1px solid rgba(255,59,48,.2)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={10} color={P.red} />
              <span style={{ fontSize: 9, color: P.red, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>ADMIN PANEL</span>
            </div>
          )}

          <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={`anav${tab === item.id ? ' aon' : ''}`}
                  onClick={() => setTab(item.id)}
                  title={!sideOpen ? item.label : undefined}
                  style={{ justifyContent: sideOpen ? 'flex-start' : 'center' }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {sideOpen && <span style={{ flex: 1 }}>{item.label}</span>}
                  {item.id === 'officers' && pending > 0 && sideOpen && (
                    <span style={{ background: P.yellow, color: P.bg, borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{pending}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div style={{ padding: 8, borderTop: `1px solid ${P.border}` }}>
            <button className="anav" onClick={handleLogout} style={{ justifyContent: sideOpen ? 'flex-start' : 'center', color: P.red }}>
              <LogOut size={15} style={{ flexShrink: 0 }} />{sideOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header style={{ height: 58, borderBottom: `1px solid ${P.border}`, background: P.surf, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, flexShrink: 0 }}>
            <button className="aib" onClick={() => setSideOpen(v => !v)}>{sideOpen ? <X size={13} /> : <Menu size={13} />}</button>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.muted }}>{clock.toLocaleTimeString('en-IN', { hour12: true })}</span>
            <div style={{ width: 1, height: 22, background: P.border }} />
            {pending > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 20, padding: '4px 11px' }}>
                <Bell size={12} color={P.yellow} />
                <span style={{ fontSize: 11, color: P.yellow, fontFamily: "'JetBrains Mono',monospace" }}>{pending} pending</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(0,212,255,.1)', border: '1px solid rgba(0,212,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',cursive", fontSize: 13, color: P.cyan }}>
                {(adminProfile?.displayName || 'A')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, color: P.txt, lineHeight: 1.2 }}>{adminProfile?.displayName || 'Admin'}</div>
                <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{adminProfile?.email || ''}</div>
              </div>
            </div>
          </header>

          <main style={{ flex: 1, overflow: 'auto', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
              <div>
                <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 30, color: P.txt, letterSpacing: 2, lineHeight: 1, margin: 0 }}>
                  {NAV_ITEMS.find(n => n.id === tab)?.label}
                </h1>
                <div style={{ fontSize: 11, color: P.muted, marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <button className="abtn abtn-g" onClick={fetchData} disabled={loading}>
                <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {fetchError && (
              <div style={{
                marginBottom: 18,
                padding: '12px 16px',
                background: 'rgba(255,59,48,.08)',
                border: '1px solid rgba(255,59,48,.3)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <AlertTriangle size={15} color="#ff3b30" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#ff3b30', fontWeight: 600, marginBottom: 3 }}>
                    Could not load data from database
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#ff3b3099' }}>
                    {fetchError}
                  </div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#ff3b3099', marginTop: 4 }}>
                    Make sure the backend server is running at <code>{API}</code> and Firestore Security Rules allow admin reads.
                  </div>
                </div>
              </div>
            )}
            {views[tab]}
          </main>
        </div>
      </div>
    </>
  )
}

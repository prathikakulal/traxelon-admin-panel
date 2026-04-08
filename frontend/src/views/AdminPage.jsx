// src/views/AdminPage.jsx
//hello bendekai
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Link2, Shield, CheckCircle2,
  Zap, RefreshCw, LogOut, Menu, X, AlertTriangle, Bell,
  Ticket, Activity, CreditCard,
} from 'lucide-react'
import { db, auth } from '../firebase/config.js'
import {
  doc, updateDoc, deleteDoc, increment,
  onSnapshot, query, collection, orderBy, limit
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
import { Toast } from '../components/UI.jsx'
import { fetchWithAuth, logout } from '../utils/api.js'
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
  const handleSetTab = (id) => { setTab(id); if (id !== 'officers') setHighlightUid(null) }
  const [sideOpen, setSideOpen] = useState(window.innerWidth > 768)
  
  const [stats, setStats] = useState(null)
  const [officers, setOfficers] = useState([])
  const [hasMoreOfficers, setHasMoreOfficers] = useState(true)
  const [links, setLinks] = useState([])
  const [hasMoreLinks, setHasMoreLinks] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [highlightUid, setHighlightUid] = useState(null)
  const [toast, setToast] = useState(null)
  const [clock, setClock] = useState(new Date())
  const [fetchError, setFetchError] = useState(null)
  const [loading, setLoading] = useState(false)

  // ── Enriched Links (with creator info from local officers state) ──
  const enrichedLinks = useMemo(() => {
    console.log('[DEBUG] Re-calculating enriched links. Officers:', officers.length, 'Links:', links.length)
    return links.map(l => {
      // If doc already has it, keep it
      if (l.creatorName && l.creatorEmail) return l
      
      const officer = officers.find(o => o.uid === l.uid)
      if (officer) {
        return {
          ...l,
          creatorName: officer.displayName || officer.email || l.uid,
          creatorEmail: officer.email || ''
        }
      }
      return l
    })
  }, [links, officers])

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Inject global STYLES ──
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = STYLES
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  // ── Fetch data from backend API (Admin SDK — bypasses Firestore rules) ──
  const fetchData = useCallback(async () => {
    if (!authed) return
    setLoading(true)
    try {
      const [statsData, usersData, linksData] = await Promise.all([
        fetchWithAuth('/api/admin/stats'),
        fetchWithAuth('/api/admin/users?limit=20&offset=0'),
        fetchWithAuth('/api/admin/links?limit=20&offset=0'),
      ])
      setStats(statsData)
      setOfficers(usersData)
      setLinks(linksData)
      
      setHasMoreOfficers(usersData?.length === 20)
      setHasMoreLinks(linksData?.length === 20)
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
      if (o.status === 'approved') return // Already approved
      
      const upd = { status: 'approved' }
      let newCredits = false
      if (!o?.creditGranted) { upd.credits = (o?.credits || 0) + 1; upd.creditGranted = true; newCredits = true }
      
      await updateDoc(doc(db, 'users', uid), upd)
      
      // Sync global stats
      const statsRef = doc(db, 'metadata', 'dashboardStats')
      const statUpdate = { approved: increment(1) }
      if (o.status === 'rejected') statUpdate.pending = increment(-1)
      if (newCredits) statUpdate.totalCredits = increment(1)
      try { await updateDoc(statsRef, statUpdate) } catch(err) {}

      // Update local state to reflect change immediately without refresh
      setOfficers(prev => prev.map(x => x.uid === uid ? { ...x, ...upd } : x))
      setStats(prev => {
        if (!prev) return prev
        const next = { ...prev, approved: prev.approved + 1 }
        if (o.status === 'rejected') next.pending = Math.max(0, prev.pending - 1)
        if (newCredits) next.totalCredits = prev.totalCredits + 1
        return next
      })

      showToast(o?.creditGranted ? 'Officer re-approved ✓' : 'Approved — 1 free credit granted ✓')
    } catch (e) { showToast(e.message, false) }
  }

  const handleReject = async (uid) => {
    try {
      const o = officers.find(x => x.uid === uid)
      if (o.status === 'rejected') return // Already rejected
      
      // Revoking means moving them to 'rejected' natively
      await updateDoc(doc(db, 'users', uid), { status: 'rejected' })
      
      // Sync global stats
      const statsRef = doc(db, 'metadata', 'dashboardStats')
      const statUpdate = {}
      if (o.status !== 'rejected') {
        statUpdate.approved = increment(-1)
        statUpdate.pending = increment(1)
      }
      if (Object.keys(statUpdate).length > 0) {
        try { await updateDoc(statsRef, statUpdate) } catch(err) {}
      }

      // Update local state to reflect change immediately without refresh
      setOfficers(prev => prev.map(x => x.uid === uid ? { ...x, status: 'rejected' } : x))
      setStats(prev => {
        if (!prev) return prev
        const next = { ...prev }
        if (o.status !== 'rejected') {
          next.approved = Math.max(0, prev.approved - 1)
          next.pending = prev.pending + 1
        }
        return next
      })

      showToast('Access revoked')
    } catch (e) { showToast(e.message, false) }
  }

  const handleAddCredit = async (uid, amount) => {
    if (!amount || amount < 1) return
    try {
      await updateDoc(doc(db, 'users', uid), { credits: increment(amount) })
      
      // Sync global stats
      try {
        const statsRef = doc(db, 'metadata', 'dashboardStats')
        await updateDoc(statsRef, { totalCredits: increment(amount) })
      } catch (err) { console.warn('Stats sync failed:', err.message) }

      setOfficers(prev => prev.map(x => x.uid === uid ? { ...x, credits: (x.credits || 0) + amount } : x))
      showToast(`+${amount} credit${amount > 1 ? 's' : ''} added`)
    } catch (e) { showToast(e.message, false) }
  }

  const handleDeductCredit = async (uid, amount = 1) => {
    const o = officers.find(x => x.uid === uid)
    if ((o?.credits || 0) < amount) { showToast('Not enough credits to deduct', false); return }
    try {
      await updateDoc(doc(db, 'users', uid), { credits: increment(-amount) })
      
      // Sync global stats
      try {
        const statsRef = doc(db, 'metadata', 'dashboardStats')
        await updateDoc(statsRef, { totalCredits: increment(-amount) })
      } catch (err) { console.warn('Stats sync failed:', err.message) }

      setOfficers(prev => prev.map(x => x.uid === uid ? { ...x, credits: Math.max(0, (x.credits || 0) - amount) } : x))
      showToast(`−${amount} credit${amount > 1 ? 's' : ''} deducted`)
    } catch (e) { showToast(e.message, false) }
  }

  const handleDelete = async (uid) => {
    if (!window.confirm('Permanently delete this officer? This will also remove their login credentials and activity logs.')) return
    try { 
      await fetchWithAuth(`/api/admin/users/${uid}`, { method: 'DELETE' })
      
      // Update local state without refresh
      setOfficers(prev => prev.filter(x => x.uid !== uid))
      
      showToast('Officer and credentials permanently deleted') 
    }
    catch (e) { showToast(e.message, false) }
  }

  const handleLogout = async () => {
    try { await auth.signOut() } catch (e) { }
    logout()
  }

  const loadMoreOfficers = async () => {
    if (officers.length === 0 || loadingMore || !hasMoreOfficers) return
    setLoadingMore(true)
    try {
      const offset = officers.length
      const more = await fetchWithAuth(`/api/admin/users?offset=${offset}&limit=20`)
      if (more?.length > 0) {
        setOfficers(p => {
          const ids = new Set(p.map(x => x.uid))
          const filtered = more.filter(m => !ids.has(m.uid))
          return [...p, ...filtered]
        })
      }
      setHasMoreOfficers(more?.length === 20)
    } catch (e) { showToast(e.message, false) }
    finally { setLoadingMore(false) }
  }

  const loadMoreLinks = async () => {
    if (links.length === 0 || loadingMore || !hasMoreLinks) return
    setLoadingMore(true)
    try {
      const offset = links.length
      const more = await fetchWithAuth(`/api/admin/links?offset=${offset}&limit=20`)
      if (more?.length > 0) {
        setLinks(p => {
          const ids = new Set(p.map(x => x.id))
          const filtered = (more.captures ? more.captures : more).filter(m => !ids.has(m.id))
          return [...p, ...filtered]
        })
      }
      setHasMoreLinks(more?.length === 20)
    } catch (e) { showToast(e.message, false) }
    finally { setLoadingMore(false) }
  }

  useEffect(() => {
    if (!authed) return
    console.log('[DEBUG] Setting up "trackingLinks" real-time listener (limited to first 20)')
    // No setloading(true) here because it might flicker, fetchData already handled it
    
    // We only listen to the first 20 to keep it paginated and performant
    const q = query(
      collection(db, 'trackingLinks'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsub = onSnapshot(q, (snap) => {
      console.log('[DEBUG] Firestore Snapshot Received. Size:', snap.size)
      const docs = snap.docs.map(d => {
        const data = d.data()
        return { 
          id: d.id, 
          ...data,
          token: data.token || d.id 
        }
      })
      
      setLinks(prev => {
        // Only update the first 20 by merging with the rest of the existing list (older pages)
        const rest = prev.length > 20 ? prev.slice(20) : []
        const ids = new Set(docs.map(d => d.id))
        const filteredRest = rest.filter(r => !ids.has(r.id))
        return [...docs, ...filteredRest]
      })
    }, (err) => {
      console.error('[DEBUG] Real-time Error:', err.message)
      setFetchError(err.message)
    })

    return () => unsub()
  }, [authed])

  // Real-time listener for users (officers)
  useEffect(() => {
    if (!authed) return
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
      setOfficers(prev => {
        const rest = prev.length > 20 ? prev.slice(20) : []
        const ids = new Set(docs.map(d => d.uid))
        const filteredRest = rest.filter(r => !ids.has(r.uid))
        return [...docs, ...filteredRest]
      })
    }, (err) => {
      console.error('[DEBUG] Users Real-time Error:', err.message)
    })
    return () => unsub()
  }, [authed])

  // Real-time listener for dashboard stats
  useEffect(() => {
    if (!authed) return
    const unsub = onSnapshot(doc(db, 'metadata', 'dashboardStats'), (snap) => {
      if (snap.exists()) setStats(snap.data())
    })
    return () => unsub()
  }, [authed])

  const fetchCaptures = async (linkId) => {
    try {
      const data = await fetchWithAuth(`/api/admin/links/${linkId}/captures`)
      if (data?.captures) {
        setLinks(prev => prev.map(l => l.id === linkId ? { ...l, captures: data.captures, captureCount: data.captureCount } : l))
      }
    } catch (e) {
      console.error('Failed to fetch captures:', e.message)
    }
  }

  const pending = stats?.pending || 0

  if (!authed) {
    return (
      <AdminLoginView onLoginSuccess={(profile, token) => {
        sessionStorage.setItem('adminAuthed', 'true')
        sessionStorage.setItem('adminProfile', JSON.stringify(profile))
        localStorage.setItem('adminToken', token)
        setAdminProfile(profile)
        setAuthed(true)
      }} />
    )
  }

  const views = {
    overview: <OverviewView stats={stats} setTab={handleSetTab} />,
    officers: <OfficersView officers={officers} links={enrichedLinks} onApprove={handleApprove} onReject={handleReject} onAddCredit={handleAddCredit} onDeductCredit={handleDeductCredit} onDelete={handleDelete} onLoadMore={loadMoreOfficers} hasMore={hasMoreOfficers} loadingMore={loadingMore} highlightUid={highlightUid} />,
    links: <LinksView links={enrichedLinks} onLoadMore={loadMoreLinks} hasMore={hasMoreLinks} loadingMore={loadingMore} onOfficerClick={(uid) => { setHighlightUid(uid); setTab('officers') }} onFetchCaptures={fetchCaptures} />,
    credits: <CreditsView officers={officers} onAddCredit={handleAddCredit} onDeductCredit={handleDeductCredit} onDelete={handleDelete} />,
    coupons: <CouponsView showToast={showToast} />,
    activity: <ActivityView />,
    payments: <PaymentsView showToast={showToast} officers={officers} onAddCredit={handleAddCredit} />,
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
                  onClick={() => handleSetTab(item.id)}
                  title={!sideOpen ? item.label : undefined}
                  style={{ justifyContent: sideOpen ? 'flex-start' : 'center' }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {sideOpen && <span style={{ flex: 1 }}>{item.label}</span>}
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
          <header className="admin-header" style={{ height: 58, borderBottom: `1px solid ${P.border}`, background: P.surf, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0 }}>
            <button className="aib" onClick={() => setSideOpen(v => !v)}>{sideOpen ? <X size={13} /> : <Menu size={13} />}</button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              {/* Mobile-only: date + time in header centre */}
              <div className="header-mobile-dt">
                <span className="header-mobile-time">{clock.toLocaleTimeString('en-IN', { hour12: true })}</span>
                <span className="header-mobile-date">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
            <span className="header-clock" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.muted }}>{clock.toLocaleTimeString('en-IN', { hour12: true })}</span>
            <div className="header-divider" style={{ width: 1, height: 22, background: P.border }} />
            {pending > 0 && (
              <div className="header-pending" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 20, padding: '5px 10px', flexShrink: 0 }}>
                <Bell size={12} color={P.yellow} />
                <span style={{ fontSize: 11, color: P.yellow, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{pending} pending</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(0,212,255,.1)', border: '1px solid rgba(0,212,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',cursive", fontSize: 13, color: P.cyan, flexShrink: 0 }}>
                {(adminProfile?.displayName || 'A')[0].toUpperCase()}
              </div>
              <div className="header-profile-text">
                <div style={{ fontSize: 12, color: P.txt, lineHeight: 1.2 }}>{adminProfile?.displayName || 'Admin'}</div>
                <div className="header-email" style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{adminProfile?.email || ''}</div>
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



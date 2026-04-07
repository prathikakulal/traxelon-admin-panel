// src/views/ActivityView.jsx
import { useState, useEffect } from 'react'
import { Search, Calendar, Trash2 } from 'lucide-react'
import { db } from '../firebase/config.js'
import { collection, onSnapshot, doc, deleteDoc, query, orderBy, limit } from 'firebase/firestore'
import { SBadge, fmt } from '../components/UI.jsx'
import { fetchWithAuth } from '../utils/api.js'
import { P } from '../styles/theme.js'

export default function ActivityView() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  useEffect(() => {
    let mounted = true
    const fetchActivity = async () => {
      setLoading(true)
      try {
        const data = await fetchWithAuth(`/api/admin/activity?limit=20`)
        if (mounted) {
          setLogs(data)
          if (data.length < 20) setHasMore(false)
        }
      } catch (err) {
        console.error('activityLogs error:', err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchActivity()
    return () => { mounted = false }
  }, [API])

  const loadMore = async () => {
    if (logs.length === 0 || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const lastLog = logs[logs.length - 1]
      const ts = lastLog.timestamp
      const cursor = (ts?.seconds !== undefined) ? new Date(ts.seconds * 1000).toISOString() : new Date(ts).toISOString()
      
      const more = await fetchWithAuth(`/api/admin/activity?cursor=${cursor}&limit=20`)
      if (more.length > 0) {
        setLogs(prev => [...prev, ...more])
      }
      if (more.length < 20) setHasMore(false)
    } catch (err) {
      console.error('loadMore error:', err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleDelete = async (uid, eventId) => {
    if (!confirm('Delete this log?')) return
    try {
      const type = eventId.endsWith('-login') ? 'login' : 'logout'
      const sessionId = eventId.replace(`-${type}`, '')

      await fetchWithAuth(`/api/admin/activity/${uid}/${sessionId}/${type}`, { method: 'DELETE' })

      setLogs(prev => prev.filter(l => l.id !== eventId))
    } catch (err) {
      console.error('Delete failed:', err.message)
    }
  }

  const filtered = logs.filter(l => {
    if (filter !== 'all' && l.type !== filter) return false
    if (q && !(l.email || '').toLowerCase().includes(q.toLowerCase()) && !(l.displayName || '').toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by officer…" className="ati" style={{ paddingLeft: 32, width: '100%' }} />
        </div>
        {['all', 'login', 'logout'].map(f => (
          <button key={f} className={`abtn ${filter === f ? 'abtn-p' : 'abtn-g'}`} style={{ padding: '7px 16px' }} onClick={() => setFilter(f)}>
            {f.toUpperCase()}
          </button>
        ))}
        <span style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace", marginLeft: 'auto' }}>{filtered.length} events</span>
      </div>

      <div className="atc" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                {['Event', 'Officer', 'Email', 'Date & Time', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="atr" style={{ borderBottom: `1px solid ${P.border}18` }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: log.type === 'login' ? P.green : P.red, boxShadow: `0 0 6px ${log.type === 'login' ? P.green : P.red}` }} />
                      <SBadge status={log.type || 'login'} />
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: P.txt }}>{log.displayName || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{log.email || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={11} color={P.muted} />
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.txt2 }}>{fmt(log.timestamp)}</span>
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <button
                      onClick={() => handleDelete(log.uid, log.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, padding: 4 }}
                      className="atr-del"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: P.cyan, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Loading sessions...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No activity logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && hasMore && (
          <div style={{ padding: '14px', textAlign: 'center', borderTop: `1px solid ${P.border}` }}>
            <button className="abtn abtn-g" disabled={loadingMore} onClick={loadMore}>
              {loadingMore ? 'Loading...' : 'Load More Options'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
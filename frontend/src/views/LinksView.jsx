// src/views/LinksView.jsx
import { useState } from 'react'
import { Search } from 'lucide-react'
import { SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

export default function LinksView({ links }) {
  const [q, setQ]          = useState('')
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

      {rows.map(l => (
        <div key={l.id} className="atc" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => setExp(expanded === l.id ? null : l.id)}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.cyan }}>/t/{l.token?.slice(0, 10)}…</span>
                <SBadge status={l.active ? 'active' : 'inactive'} />
              </div>
              <div style={{ fontSize: 13, color: P.txt2 }}>{l.label || 'Tracking Link'}</div>
            </div>
            <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',cursive", color: P.txt }}>{l.clicks || 0}</div>
                <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>CLICKS</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',cursive", color: l.captures?.length > 0 ? P.green : P.muted }}>{l.captures?.length || 0}</div>
                <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>CAPTURES</div>
              </div>
            </div>
          </div>

          {expanded === l.id && (
            <div style={{ borderTop: `1px solid ${P.border}`, padding: '14px 18px' }}>
              {l.captures?.length > 0 ? l.captures.map((c, i) => (
                <div key={i} style={{ background: P.surf, border: `1px solid ${P.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '8px 20px' }}>
                    {[['IP', c.ip], ['City', c.city], ['Country', c.country], ['Device', c.device], ['Browser', c.browser], ['OS', c.os], ['ISP', c.isp], ['Timezone', c.timezone], ['Screen', c.screenWidth ? `${c.screenWidth}×${c.screenHeight}` : null]]
                      .filter(([, v]) => v)
                      .map(([label, val]) => (
                        <div key={label}>
                          <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: 12, color: P.txt, fontFamily: "'JetBrains Mono',monospace" }}>{val}</div>
                        </div>
                      ))}
                  </div>
                  <div style={{ fontSize: 10, color: P.muted, marginTop: 8, fontFamily: "'JetBrains Mono',monospace" }}>{c.capturedAt}</div>
                </div>
              )) : (
                <div style={{ fontSize: 12, color: P.muted, fontFamily: "'DM Sans',sans-serif" }}>No captures yet for this link.</div>
              )}
            </div>
          )}
        </div>
      ))}

      {rows.length === 0 && (
        <div className="atc" style={{ padding: 40, textAlign: 'center', color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No tracking links yet</div>
      )}
    </div>
  )
}

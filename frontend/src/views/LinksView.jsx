import { useState, useEffect, memo } from 'react'
import { 
  Search, ChevronDown, MapPin, Clock, User, Link as LinkIcon, 
  Globe, Monitor, Cpu, HardDrive, Wifi, Activity, Zap, 
  MousePointer2, ExternalLink, Hash, Calendar, BarChart3, RefreshCw
} from 'lucide-react'
import { SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

function formatIST(raw) {
  if (!raw) return '—'
  // Handle ms epoch numbers
  if (typeof raw === 'number') raw = new Date(raw).toISOString()
  const d = new Date(raw)
  if (isNaN(d)) return String(raw)
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  })
}

const LV_CSS = `
  .l-exp-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .l-exp-wrapper.open {
    grid-template-rows: 1fr;
  }
  .l-exp-content {
    overflow: hidden;
  }
  .chev {
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .chev.open {
    transform: rotate(180deg);
  }
  .dash-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }
    grid-template-columns: 1fr 1fr;
    }
  }
  .timeline-item {
    position: relative;
    padding-left: 24px;
    margin-bottom: 20px;
    border-left: 1px dashed ${P.border};
  }
  .timeline-item::before {
    content: '';
    position: absolute;
    left: -4px;
    top: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${P.cyan};
    box-shadow: 0 0 8px ${P.cyan}88;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 1s linear infinite;
  }
`

function DataRow({ label, value, icon: Icon }) {
  if (value === null || value === undefined || value === '') return null
  const val = (typeof value === 'object') ? JSON.stringify(value) : String(value)
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {Icon && <Icon size={12} color={P.muted} style={{ marginTop: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: P.txt, fontFamily: "'JetBrains Mono',monospace", wordBreak: 'break-all', fontWeight: 500 }}>{val}</div>
      </div>
    </div>
  )
}

function DetailSection({ title, icon: Icon, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '16px', border: `1px solid ${P.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, borderBottom: `1px solid ${P.border}44`, paddingBottom: 8 }}>
        {Icon && <Icon size={14} color={P.cyan} />}
        <span style={{ fontSize: 11, fontWeight: 700, color: P.txt, fontFamily: "'Bebas Neue',cursive", letterSpacing: 1 }}>{title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px 16px' }}>
        {children}
      </div>
    </div>
  )
}

const CaptureCard = memo(({ c, i }) => {
  if (!c) return null

  // Resolve field aliases
  const ip        = c.ip || c.userIp || null
  const city      = c.gpsCity || c.city || null
  const region    = c.region || c.regionName || null
  const country   = c.gpsCountry || c.country || null
  const device    = c.device || c.deviceType || null
  const browser   = c.browser || c.browserName || null
  const browserVer = c.browserVersion || null
  const os        = c.os || c.osName || null
  const isp       = c.isp || c.org || null
  const lat       = c.gpsLat || c.lat || c.latitude || null
  const lon       = c.gpsLon || c.lon || c.longitude || null
  const address   = c.gpsAddress || c.address || null

  // Performance
  const pageLoad  = c.pageLoadTime || c.loadTime || null
  const ttfb      = c.timeToFirstByte || c.ttfb || null

  // Resolve timestamp
  let timestamp = c.capturedAt
  if (!timestamp && c.time) {
    const ms = typeof c.time === 'number' ? c.time : parseInt(c.time, 10)
    if (!isNaN(ms)) timestamp = new Date(ms).toISOString()
  }

  const locationStr = [city, region, country].filter(Boolean).join(', ')

  return (
    <div className="timeline-item">
      <div style={{ 
        background: P.surf, border: `1px solid ${P.border}`, 
        borderRadius: 10, padding: '12px 16px',
        transition: 'border-color 0.2s',
        display: 'flex', flexDirection: 'column', gap: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: P.txt, fontFamily: "'JetBrains Mono',monospace" }}>{ip || 'No IP'}</span>
            <span style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{formatIST(timestamp)}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {device && <SBadge status={device.toLowerCase().includes('mobile') ? 'inactive' : 'active'}>{device}</SBadge>}
            <SBadge status="active" style={{ background: 'rgba(0,212,255,.05)', color: P.cyan, borderColor: 'rgba(0,212,255,.2)' }}>{browser}</SBadge>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: P.txt2 }}>
          <MapPin size={11} color={P.red} /> {locationStr || 'Unknown Location'}
        </div>

        {(pageLoad || ttfb) && (
          <div style={{ display: 'flex', gap: 15, fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", borderTop: `1px solid ${P.border}44`, paddingTop: 8 }}>
            {pageLoad && <span>LOAD: <span style={{ color: P.green }}>{pageLoad}ms</span></span>}
            {ttfb && <span>TTFB: <span style={{ color: P.yellow }}>{ttfb}ms</span></span>}
          </div>
        )}
      </div>
    </div>
  )
})

export default function LinksView({ links, onLoadMore, hasMore, loadingMore, onOfficerClick, onFetchCaptures }) {
  const [q, setQ] = useState('')
  const [expanded, setExp] = useState(null)

  // Inject CSS
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = LV_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

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
        const captures = Array.isArray(l.captures) ? l.captures : []
        const captureCount = l.captureCount || captures.length || 0

        return (
          <div key={l.id} className="atc" style={{ overflow: 'hidden' }}>

            {/* ── Header row (clickable) ── */}
            <div
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', userSelect: 'none' }}
              onClick={() => {
                const nextOpen = isOpen ? null : l.id
                setExp(nextOpen)
                if (nextOpen && captures.length === 0 && onFetchCaptures) {
                  onFetchCaptures(l.id)
                }
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.cyan }}>/t/{(l.token || l.id)?.slice(0, 10)}…</span>
                  <SBadge status={l.active ? 'active' : 'inactive'} />
                  {l.creatorName && (
                    <button
                      onClick={e => { e.stopPropagation(); onOfficerClick && onOfficerClick(l.uid) }}
                      title={`Go to officer: ${l.creatorName}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(0,212,255,.08)', border: '1px solid rgba(0,212,255,.2)',
                        borderRadius: 20, padding: '2px 8px', cursor: 'pointer',
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: P.cyan,
                        transition: 'background .15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,212,255,.08)'}
                    >
                      <User size={9} /> {l.creatorName}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: P.txt2 }}>{l.label || 'Tracking Link'}</div>
              </div>

              <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',cursive", color: P.txt }}>{l.clicks || 0}</div>
                  <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>CLICKS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',cursive", color: captureCount > 0 ? P.green : P.muted }}>{captureCount}</div>
                  <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>CAPTURES</div>
                </div>
                <div className={`chev${isOpen ? ' open' : ''}`} style={{ color: P.muted }}>
                  <ChevronDown size={15} />
                </div>
              </div>
            </div>

            {/* ── Expanded Dashboard (Sliding) ── */}
            <div className={`l-exp-wrapper${isOpen ? ' open' : ''}`}>
              <div className="l-exp-content">
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${P.border}`, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* DASHBOARD GRID */}
                    <div className="dash-grid">
                      
                      {/* A. BASIC INFO */}
                      <DetailSection title="Basic Info" icon={LinkIcon}>
                        <DataRow label="Label" value={l.label || 'Unnamed Link'} icon={User} />
                        <DataRow label="Tracking URL" value={l.trackingUrl || `${window.location.origin}/t/${l.token}`} icon={LinkIcon} />
                        <DataRow label="Destination" value={l.destinationUrl} icon={ExternalLink} />
                        <DataRow label="Token" value={l.token} icon={Hash} />
                        <DataRow label="Created At" value={formatIST(l.createdAt)} icon={Calendar} />
                        <DataRow label="Total Clicks" value={l.clicks || 0} icon={BarChart3} />
                      </DetailSection>

                      {/* B. USER / DEVICE INFO - derived from root or latest capture */}
                      {(() => {
                        const base = captures[0] || (l.captures?.[0]) || l || {}
                        const bName = base.browser || base.browserName
                        const bVer = base.browserVersion || base.version
                        const browserFull = bName ? `${bName}${bVer ? ' ' + bVer : ''}` : null
                        
                        return (
                          <DetailSection title="User / Device" icon={Monitor}>
                            <DataRow label="Browser" value={browserFull} icon={Globe} />
                            <DataRow label="OS" value={base.os || base.osName} icon={Monitor} />
                            <DataRow label="Device Type" value={base.device || base.deviceType} icon={User} />
                            <DataRow label="CPU Cores" value={base.cpu || base.hardwareConcurrency} icon={Cpu} />
                            <DataRow label="RAM" value={base.ram || base.deviceMemory ? (typeof (base.ram || base.deviceMemory) === 'number' ? `${base.ram || base.deviceMemory} GB` : base.ram || base.deviceMemory) : null} icon={HardDrive} />
                            <DataRow label="GPU Info" value={base.gpu || base.unmaskedRenderer || base.unmaskedVendor} icon={Zap} />
                          </DetailSection>
                        )
                      })()}

                      {/* C. LOCATION INFO */}
                      {(() => {
                        const base = captures[0] || (l.captures?.[0]) || l || {}
                        const loc = [base.city || base.gpsCity, base.region || base.regionName, base.country || base.gpsCountry].filter(Boolean).join(', ')
                        const lat = base.lat || base.gpsLat || base.latitude
                        const lon = base.lon || base.gpsLon || base.longitude
                        const addr = base.address || base.gpsAddress
                        const addrStr = (addr && typeof addr === 'object') ? [addr.neighbourhood, addr.city, addr.country].filter(Boolean).join(', ') : addr
                        
                        return (
                          <DetailSection title="Location" icon={MapPin}>
                            <DataRow label="City, Region, Country" value={loc} icon={MapPin} />
                            <DataRow label="IP Address" value={base.ip || base.userIp} icon={Globe} />
                            <DataRow label="ISP / ASN" value={base.isp || base.asn || base.org} icon={Wifi} />
                            <DataRow label="GPS (Lat, Lon)" value={lat ? `${lat}, ${lon}` : null} icon={MapPin} />
                            <DataRow label="Formatted Address" value={addrStr} icon={MapPin} />
                          </DetailSection>
                        )
                      })()}

                      {/* D. NETWORK & PERFORMANCE */}
                      {(() => {
                        const base = captures[0] || (l.captures?.[0]) || l || {}
                        return (
                          <DetailSection title="Network & Performance" icon={Activity}>
                            <DataRow label="Connection Type" value={base.connectionType || base.effectiveType} icon={Wifi} />
                            <DataRow label="RTT" value={base.rtt ? `${base.rtt}ms` : null} icon={Activity} />
                            <DataRow label="Downlink" value={base.downlink ? `${base.downlink} Mbps` : null} icon={Zap} />
                            <DataRow label="Page Load Time" value={base.pageLoadTime || base.loadTime ? `${base.pageLoadTime || base.loadTime}ms` : null} icon={Clock} />
                            <DataRow label="Time to First Byte" value={base.timeToFirstByte || base.ttfb ? `${base.timeToFirstByte || base.ttfb}ms` : null} icon={Clock} />
                          </DetailSection>
                        )
                      })()}
                    </div>

                    {/* E. CAPTURES SECTION */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${P.border}, transparent)` }} />
                        <span style={{ fontSize: 13, color: P.txt, fontFamily: "'Bebas Neue',cursive", letterSpacing: 2 }}>CAPTURES TIMELINE</span>
                        <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${P.border}, transparent)` }} />
                      </div>

                      {captures.length > 0 ? (
                        <div style={{ marginTop: 10 }}>
                          {captures.map((c, i) => <CaptureCard key={c.id || i} c={c} i={i} />)}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '30px 0', color: P.muted, fontSize: 13 }}>
                          {captureCount > 0 ? (
                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                               <RefreshCw size={20} className="spin" />
                               <span>Fetching visitor data...</span>
                             </div>
                          ) : 'No captures yet for this link.'}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            </div>
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
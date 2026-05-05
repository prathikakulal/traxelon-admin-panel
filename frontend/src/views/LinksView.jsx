import { useState, useEffect, useMemo, memo } from 'react'
import { 
  Search, ChevronDown, MapPin, Clock, User, Link as LinkIcon, 
  Globe, Monitor, Cpu, HardDrive, Wifi, Activity, Zap, 
  MousePointer2, ExternalLink, Hash, Calendar, BarChart3, RefreshCw, Shield,
  Filter, X, ChevronUp
} from 'lucide-react'
import { SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

function formatIST(raw) {
  if (!raw) return '—'
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

// Normalise a timestamp to a local-date YYYY-MM-DD string for comparison
function toDateStr(raw) {
  if (!raw) return null
  const d = typeof raw === 'number' ? new Date(raw) : new Date(raw)
  if (isNaN(d)) return null
  // Use local date (IST-aware) via toLocaleDateString
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // yields YYYY-MM-DD
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
  @media (min-width: 768px) {
    .dash-grid {
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

  /* ── Link header row ── */
  .lv-header-row {
    padding: 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    cursor: pointer;
    user-select: none;
  }
  @media (min-width: 640px) {
    .lv-header-row {
      flex-direction: row;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
    }
  }
  .lv-meta { flex: 1; min-width: 0; }
  .lv-stats {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-shrink: 0;
  }

  /* ── CaptureCard header ── */
  .cc-header-row {
    padding: 14px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  @media (min-width: 640px) {
    .cc-header-row {
      display: grid;
      grid-template-columns: 45px 75px 160px 180px 140px 1fr 140px;
      align-items: center;
      gap: 15px;
      padding: 16px 24px;
    }
  }
  .cc-mobile-top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .cc-mobile-bottom {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 11px;
  }
  .cc-mobile-bottom-item { display: flex; flex-direction: column; }
  .cc-desktop-only { display: none; }
  @media (min-width: 640px) {
    .cc-desktop-only { display: block; }
    .cc-mobile-only { display: none !important; }
  }

  /* ── Filter bar ── */
  .lv-filter-bar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    background: rgba(0,212,255,0.03);
    border: 1px solid ${P.border};
    border-radius: 10px;
    margin-bottom: 4px;
    animation: filterSlide 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  @keyframes filterSlide {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (min-width: 640px) {
    .lv-filter-bar {
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
  }
  .lv-filter-label {
    font-size: 9px;
    color: ${P.muted};
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .lv-filter-group { display: flex; flex-direction: column; }
  .lv-filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(0,212,255,0.10);
    border: 1px solid rgba(0,212,255,0.25);
    color: ${P.cyan};
    border-radius: 20px;
    padding: 3px 10px 3px 8px;
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
  }
  .lv-filter-chip:hover { background: rgba(0,212,255,0.18); }
  .lv-date-input {
    background: rgba(255,255,255,0.04);
    border: 1px solid ${P.border};
    border-radius: 6px;
    color: ${P.txt};
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    padding: 5px 8px;
    outline: none;
    transition: border-color 0.2s;
    color-scheme: dark;
  }
  .lv-date-input:focus { border-color: ${P.cyan}88; }
  .lv-no-results {
    text-align: center;
    padding: 40px 0;
    color: ${P.muted};
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
  }
  .lv-active-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
`

/* ────────────────────────────────────────────────────────── */
/*  Sub-components                                            */
/* ────────────────────────────────────────────────────────── */

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

const SectionTitle = ({ icon: Icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
    <Icon size={12} color={P.cyan} />
    <span style={{ fontSize: 10, fontWeight: 700, color: P.cyan, letterSpacing: 1.5, fontFamily: "'JetBrains Mono',monospace" }}>{title}</span>
  </div>
)

const Grid = ({ children }) => (
  <div style={{ 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
    gap: '12px 20px', borderBottom: `1px solid ${P.border}22`, paddingBottom: 15
  }}>
    {children}
  </div>
)

const CaptureCard = memo(({ c, i }) => {
  if (!c) return null
  const [isExpanded, setIsExpanded] = useState(false)

  const ip = c.ip || '0.0.0.0'
  const isp = (c.isp || 'Unknown Provider').toUpperCase()
  const city = c.city || 'Unknown'
  const country = c.country || 'Unknown'
  const device = c.device || 'Unknown'
  const browser = c.browser || ''
  const os = c.os || ''
  const timestamp = c.capturedAt

  const hw = c.hardware || {}
  const bat = c.battery || {}
  const scr = c.screen || {}
  const net = c.network || {}

  return (
    <div className="capture-wrapper" style={{ 
      background: 'rgba(255,255,255,0.02)', 
      border: `1px solid ${isExpanded ? P.cyan : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 12, overflow: 'hidden', margin: '8px 0',
      transition: 'all 0.2s',
      boxShadow: isExpanded ? `0 0 15px ${P.cyan}11` : 'none'
    }}>
      {/* Mobile header */}
      <div className="cc-header-row cc-mobile-only" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="cc-mobile-top">
          <div style={{ background: 'rgba(0,212,255,0.08)', color: P.cyan, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4, border: `1px solid ${P.cyan}33`, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>#{i}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,59,48,0.08)', color: P.red, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 20, border: `1px solid ${P.red}44`, flexShrink: 0 }}>
            <MapPin size={9} fill={P.red} /> GPS
          </div>
          <ChevronDown size={14} color={P.muted} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', marginLeft: 'auto' }} />
        </div>
        <div className="cc-mobile-bottom">
          <div className="cc-mobile-bottom-item">
            <span style={{ fontSize: 9, color: P.muted, marginBottom: 1 }}>TIME</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: P.txt }}>{formatIST(timestamp)}</span>
          </div>
          <div className="cc-mobile-bottom-item">
            <span style={{ fontSize: 9, color: P.muted, marginBottom: 1 }}>IP</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: P.txt }}>{ip}</span>
            <span style={{ fontSize: 9, color: P.muted }}>{isp.length > 20 ? isp.slice(0,20)+'…' : isp}</span>
          </div>
          <div className="cc-mobile-bottom-item">
            <span style={{ fontSize: 9, color: P.muted, marginBottom: 1 }}>LOCATION</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: P.txt }}>{city}</span>
            <span style={{ fontSize: 9, color: P.muted }}>{country}</span>
          </div>
          <div className="cc-mobile-bottom-item">
            <span style={{ fontSize: 9, color: P.muted, marginBottom: 1 }}>DEVICE</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: P.txt }}>{device}</span>
            <span style={{ fontSize: 9, color: P.muted }}>{browser}</span>
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="cc-desktop-only" onClick={() => setIsExpanded(!isExpanded)} style={{ padding: '16px 24px', cursor: 'pointer', display: 'grid', gridTemplateColumns: '45px 75px 160px 180px 140px 1fr 140px', alignItems: 'center', gap: 15 }}>
        <div style={{ background: 'rgba(0,212,255,0.08)', color: P.cyan, fontSize: 10, fontWeight: 700, padding: '3px 0', borderRadius: 4, textAlign: 'center', border: `1px solid ${P.cyan}33`, fontFamily: "'JetBrains Mono',monospace" }}>#{i}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,59,48,0.08)', color: P.red, fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 20, border: `1px solid ${P.red}44` }}>
          <MapPin size={10} fill={P.red} /> GPS
        </div>
        <div>
          <div style={{ fontSize: 9, color: P.muted, marginBottom: 2, letterSpacing: 0.5 }}>DATE / TIME</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: P.txt }}>{formatIST(timestamp)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: P.muted, marginBottom: 2, letterSpacing: 0.5 }}>IP / PROVIDER</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: P.txt }}>{ip}</div>
          <div style={{ fontSize: 9, color: P.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isp}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: P.muted, marginBottom: 2, letterSpacing: 0.5 }}>LOCATION</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: P.txt }}>{city}</div>
          <div style={{ fontSize: 9, color: P.muted }}>{country}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: P.muted, marginBottom: 2, letterSpacing: 0.5 }}>DEVICE</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: P.txt }}>{device}</div>
          <div style={{ fontSize: 9, color: P.muted }}>{browser} · {os}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <ChevronDown size={16} color={P.muted} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ padding: '0 16px 20px 16px', animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ borderTop: `1px solid ${P.border}33`, paddingTop: 18 }} />
          <SectionTitle icon={Globe} title="NETWORK & IP" />
          <Grid>
            <DataRow label="IP ADDRESS" value={ip} />
            <DataRow label="ISP" value={c.isp || isp} />
            <DataRow label="ORGANISATION" value={c.isp || isp} />
            <DataRow label="ASN" value={c.asn || 'Unknown'} />
            <DataRow label="CONNECTION TYPE" value={net.effectiveType} />
            <DataRow label="RTT" value={net.rtt ? `${net.rtt} ms` : null} />
            <DataRow label="LATENCY" value={c.latency ? `${c.latency} ms` : null} />
            <DataRow label="TIMEZONE" value={c.timezone} />
          </Grid>
          <SectionTitle icon={MapPin} title="IP LOCATION (APPROXIMATE)" />
          <Grid>
            <DataRow label="CITY" value={city} />
            <DataRow label="REGION" value={c.region} />
            <DataRow label="COUNTRY" value={country} />
            <DataRow label="COUNTRY CODE" value={c.countryCode} />
            <DataRow label="ZIP" value={c.zip} />
            <DataRow label="COORDINATES" value={c.lat && c.lon ? `${c.lat}, ${c.lon}` : null} />
          </Grid>
          {(c.gps || c.gpsLat) && (() => {
            const gLat = c.gps?.lat || c.gpsLat
            const gLon = c.gps?.lon || c.gpsLon
            const gAcc = c.gps?.accuracy || c.gpsAccuracy
            if (!gLat || !gLon) return null
            return (
              <>
                <SectionTitle icon={MapPin} title="GPS LOCATION (EXACT)" />
                <Grid>
                  <DataRow label="GPS COORDS" value={`${gLat}, ${gLon}`} />
                  <DataRow label="ACCURACY" value={gAcc ? `${Math.round(gAcc)} metres` : 'Unknown'} />
                </Grid>
                <div style={{ marginTop: 15, borderRadius: 12, overflow: 'hidden', border: `1px solid ${P.border}44`, position: 'relative' }}>
                  <iframe width="100%" height="220" frameBorder="0" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8)' }} src={`https://maps.google.com/maps?q=${gLat},${gLon}&z=16&output=embed`} />
                  <div style={{ padding: 12, borderTop: `1px solid ${P.border}22`, background: P.surf }}>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps?q=${gLat},${gLon}`, '_blank') }} style={{ background: 'none', border: `1px solid ${P.cyan}`, color: P.cyan, padding: '8px 16px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                      <MapPin size={12} fill={P.cyan} /> View on Google Maps
                    </button>
                  </div>
                </div>
              </>
            )
          })()}
          <SectionTitle icon={Cpu} title="DEVICE & HARDWARE" />
          <Grid>
            <DataRow label="DEVICE TYPE" value={device} />
            <DataRow label="OS" value={os} />
            <DataRow label="BROWSER" value={browser} />
            <DataRow label="BROWSER VERSION" value={c.browserVersion} />
            <DataRow label="PLATFORM" value={hw.platform || c.platform} />
            <DataRow label="CPU CORES" value={hw.cpuCores || c.cpuCores} />
            <DataRow label="RAM" value={hw.ram || c.ram ? `${hw.ram || c.ram} GB` : null} />
            <DataRow label="GPU" value={hw.gpu || c.gpu} />
            <DataRow label="VENDOR" value={hw.vendor || c.vendor} />
            <DataRow label="TOUCH POINTS" value={hw.maxTouchPoints || c.maxTouchPoints} />
          </Grid>
          <SectionTitle icon={Monitor} title="SCREEN EXTRAS" />
          <Grid>
            <DataRow label="RESOLUTION" value={scr.width || c.screenWidth ? `${scr.width || c.screenWidth} x ${scr.height || c.screenHeight}` : null} />
            <DataRow label="WINDOW" value={c.windowWidth ? `${c.windowWidth} x ${c.windowHeight}` : null} />
            <DataRow label="DPR / PIXEL RATIO" value={scr.dpr || c.pixelRatio} />
            <DataRow label="COLOR DEPTH" value={scr.colorDepth || c.colorDepth ? `${scr.colorDepth || c.colorDepth}-bit` : null} />
            <DataRow label="ORIENTATION" value={c.screenOrientation} />
          </Grid>
          <SectionTitle icon={Clock} title="PERFORMANCE BREAKDOWN" />
          <Grid>
            <DataRow label="DNS LOOKUP" value={c.dnsLookupTime ? `${c.dnsLookupTime} ms` : null} />
            <DataRow label="TCP CONNECTION" value={c.tcpConnectionTime ? `${c.tcpConnectionTime} ms` : null} />
            <DataRow label="SERVER RESPONSE" value={c.serverResponseTime ? `${c.serverResponseTime} ms` : null} />
            <DataRow label="PAGE LOAD TIME" value={c.pageLoadTime ? `${c.pageLoadTime} ms` : null} />
            <DataRow label="BROWSER RENDER" value={c.browserRenderTime ? `${c.browserRenderTime} ms` : null} />
          </Grid>
          <SectionTitle icon={Zap} title="ENVIRONMENT & BATTERY" />
          <Grid>
            <DataRow label="BATTERY LEVEL" value={c.batteryLevel ? `${c.batteryLevel}%` : (bat.level ? `${Math.round(bat.level)}%` : null)} />
            <DataRow label="CHARGING" value={c.batteryCharging !== undefined ? (c.batteryCharging ? 'Yes' : 'No') : (bat.charging ? 'Yes' : 'No')} />
            <DataRow label="INCOGNITO" value={c.incognito ? 'Yes' : 'No'} />
            <DataRow label="LANGUAGE" value={c.language || c.languages} />
            <DataRow label="DO NOT TRACK" value={c.doNotTrack} />
          </Grid>
          <SectionTitle icon={Shield} title="BROWSER DETAILS & SECURITY" />
          <Grid>
            <DataRow label="POPUPS ALLOWED" value={c.popupBlocked === false ? 'Yes' : (c.popupBlocker === false ? 'Yes' : 'No')} />
            <DataRow label="WEBSOCKET ALLOWED" value={c.webSocketAllowed !== undefined ? (c.webSocketAllowed ? 'Yes' : 'No') : (c.websocketAllowed ? 'Yes' : 'No')} />
            <DataRow label="ADBLOCK DETECTED" value={c.adBlockEnabled ? 'Yes' : 'No'} />
            <DataRow label="CANVAS HASH" value={c.fingerprint || c.canvasHash} />
            <DataRow label="FINGERPRINT (ALT)" value={c.fingerprint} />
          </Grid>
          <SectionTitle icon={Activity} title="PERMISSIONS" />
          <Grid>
            <DataRow label="GEOLOCATION" value={c.permGeolocation} />
            <DataRow label="CAMERA" value={c.permCamera} />
            <DataRow label="MICROPHONE" value={c.permMicrophone} />
            <DataRow label="NOTIFICATIONS" value={c.permNotifications} />
          </Grid>
          <div style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace", opacity: 0.4, borderTop: `1px solid ${P.border}11`, paddingTop: 8, wordBreak: 'break-all' }}>
            AGENT: {c.userAgent}
          </div>
        </div>
      )}
    </div>
  )
})

/* ────────────────────────────────────────────────────────── */
/*  Active-filter chip                                        */
/* ────────────────────────────────────────────────────────── */
function FilterChip({ label, onRemove }) {
  return (
    <span className="lv-filter-chip" onClick={onRemove}>
      <X size={9} /> {label}
    </span>
  )
}

/* ────────────────────────────────────────────────────────── */
/*  Main component                                            */
/* ────────────────────────────────────────────────────────── */
export default function LinksView({ links, onLoadMore, hasMore, loadingMore, onOfficerClick, onFetchCaptures }) {
  const [q, setQ] = useState('')
  const [expanded, setExp] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [selectedUser, setSelectedUser] = useState('')   // uid value
  const [dateFrom, setDateFrom]         = useState('')   // YYYY-MM-DD
  const [dateTo, setDateTo]             = useState('')   // YYYY-MM-DD

  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = LV_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  // Build unique officer list from links
  const officers = useMemo(() => {
    const seen = new Map()
    links.forEach(l => {
      if (l.uid && l.creatorName && !seen.has(l.uid)) {
        seen.set(l.uid, l.creatorName)
      }
    })
    return Array.from(seen.entries()).map(([uid, name]) => ({ uid, name }))
  }, [links])

  // Computed: are any filters active?
  const hasActiveFilters = selectedUser || dateFrom || dateTo

  // Filter logic
  const rows = useMemo(() => {
    return links.filter(l => {
      // Text search
      const matchesQ =
        (l.token || '').includes(q) ||
        (l.label || '').toLowerCase().includes(q.toLowerCase())
      if (!matchesQ) return false

      // User filter
      if (selectedUser && l.uid !== selectedUser) return false

      // Date filters — compare against link createdAt
      const dateStr = toDateStr(l.createdAt)
      if (dateFrom && dateStr && dateStr < dateFrom) return false
      if (dateTo   && dateStr && dateStr > dateTo)   return false

      return true
    })
  }, [links, q, selectedUser, dateFrom, dateTo])

  const clearFilters = () => {
    setSelectedUser('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Top bar: search + filter toggle ── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search links…"
            className="ati"
            style={{ paddingLeft: 32, width: '100%' }}
          />
        </div>

        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: hasActiveFilters ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${hasActiveFilters ? P.cyan : P.border}`,
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontSize: 11, color: hasActiveFilters ? P.cyan : P.muted,
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
            transition: 'all 0.2s',
          }}
        >
          <Filter size={12} />
          FILTER
          {hasActiveFilters && (
            <span style={{
              background: P.cyan, color: '#000', borderRadius: '50%',
              width: 16, height: 16, fontSize: 9, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 900,
            }}>
              {[selectedUser, dateFrom, dateTo].filter(Boolean).length}
            </span>
          )}
          {showFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {/* Count badge */}
        <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", marginLeft: 'auto' }}>
          {rows.length}/{links.length} LINKS
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="lv-filter-bar">

          {/* User / Officer filter */}
          <div className="lv-filter-group" style={{ flex: '1 1 180px' }}>
            <div className="lv-filter-label">Officer / User</div>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedUser ? P.cyan + '88' : P.border}`,
                borderRadius: 6, color: selectedUser ? P.cyan : P.txt2,
                fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
                padding: '5px 8px', outline: 'none', cursor: 'pointer',
                colorScheme: 'dark',
              }}
            >
              <option value="">All Officers</option>
              {officers.map(o => (
                <option key={o.uid} value={o.uid}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="lv-filter-group" style={{ flex: '1 1 140px' }}>
            <div className="lv-filter-label">From Date</div>
            <input
              type="date"
              className="lv-date-input"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={e => setDateFrom(e.target.value)}
              style={{ borderColor: dateFrom ? P.cyan + '88' : undefined }}
            />
          </div>

          {/* Date To */}
          <div className="lv-filter-group" style={{ flex: '1 1 140px' }}>
            <div className="lv-filter-label">To Date</div>
            <input
              type="date"
              className="lv-date-input"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={e => setDateTo(e.target.value)}
              style={{ borderColor: dateTo ? P.cyan + '88' : undefined }}
            />
          </div>

          {/* Clear button — only when something is set */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                alignSelf: 'flex-end',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,59,48,0.08)', border: `1px solid ${P.red}44`,
                borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                fontSize: 10, color: P.red,
                fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}
            >
              <X size={10} /> CLEAR
            </button>
          )}
        </div>
      )}

      {/* ── Active filter chips (compact summary when panel is collapsed) ── */}
      {!showFilters && hasActiveFilters && (
        <div className="lv-active-filters">
          <span style={{ fontSize: 9, color: P.muted, fontFamily: "'JetBrains Mono',monospace", marginRight: 2 }}>FILTERED BY:</span>
          {selectedUser && (
            <FilterChip
              label={`OFFICER: ${officers.find(o => o.uid === selectedUser)?.name || selectedUser}`}
              onRemove={() => setSelectedUser('')}
            />
          )}
          {dateFrom && (
            <FilterChip label={`FROM: ${dateFrom.split('-').reverse().join('/')}`} onRemove={() => setDateFrom('')} />

          )}
          {dateTo && (
            <FilterChip label={`TO: ${dateTo.split('-').reverse().join('/')}`} onRemove={() => setDateTo('')} />
          )}
          <button
            onClick={clearFilters}
            style={{ fontSize: 9, color: P.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace', padding: '0 4px" }}
          >
            CLEAR ALL
          </button>
        </div>
      )}

      {/* ── Link rows ── */}
      {rows.map(l => {
        const isOpen = expanded === l.id
        const captures = Array.isArray(l.captures) ? l.captures : []
        const captureCount = l.captureCount || captures.length || 0

        return (
          <div key={l.id} className="atc" style={{ overflow: 'hidden' }}>

            {/* Header row */}
            <div
              className="lv-header-row"
              onClick={() => {
                const nextOpen = isOpen ? null : l.id
                setExp(nextOpen)
                if (nextOpen && captures.length === 0 && onFetchCaptures) {
                  onFetchCaptures(l.id)
                }
              }}
            >
              <div className="lv-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
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

              <div className="lv-stats">
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

            {/* Expanded dashboard */}
            <div className={`l-exp-wrapper${isOpen ? ' open' : ''}`}>
              <div className="l-exp-content">
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${P.border}`, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="dash-grid">
                      <DetailSection title="Basic Info" icon={LinkIcon}>
                        <DataRow label="Label" value={l.label || 'Unnamed Link'} icon={User} />
                        <DataRow label="Tracking URL" value={l.trackingUrl || `${window.location.origin}/t/${l.token}`} icon={LinkIcon} />
                        <DataRow label="Destination" value={l.destinationUrl} icon={ExternalLink} />
                        <DataRow label="Token" value={l.token} icon={Hash} />
                        <DataRow label="Created At" value={formatIST(l.createdAt)} icon={Calendar} />
                        <DataRow label="Total Clicks" value={l.clicks || 0} icon={BarChart3} />
                      </DetailSection>

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

                    {/* Captures section */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <h3 style={{ fontSize: 18, margin: 0, letterSpacing: 1.5, fontFamily: "'Bebas Neue', cursive", color: P.txt }}>RESULTS: {captureCount}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: P.green, fontWeight: 700 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: P.green, boxShadow: `0 0 10px ${P.green}` }} /> LIVE
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>Updates in real time</div>
                      </div>

                      {captures.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {captures.map((c, i) => (
                            <CaptureCard key={c.id || i} c={c} i={captures.length - i} />
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: P.muted, fontSize: 13, background: 'rgba(255,255,255,0.01)', borderRadius: 10, border: `1px dashed ${P.border}` }}>
                          {captureCount > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                              <RefreshCw size={24} className="spin" color={P.cyan} />
                              <span style={{ letterSpacing: 1, fontSize: 11 }}>FETCHING VISITOR INTELLIGENCE...</span>
                            </div>
                          ) : 'No captures found for this tracking link.'}
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
        <div className="atc" style={{ padding: 40, textAlign: 'center', color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
          {hasActiveFilters || q ? 'No links match the current filters.' : 'No tracking links yet'}
        </div>
      )}

      {!q && !hasActiveFilters && hasMore && (
        <div style={{ padding: '14px', textAlign: 'center' }}>
          <button className="abtn abtn-g" disabled={loadingMore} onClick={onLoadMore}>
            {loadingMore ? 'Loading...' : 'Load More Links'}
          </button>
        </div>
      )}
    </div>
  )
}
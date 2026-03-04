// src/views/OverviewView.jsx
import { Users, AlertTriangle, CheckCircle2, Zap, Link2, Eye } from 'lucide-react'
import { StatCard, SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

export default function OverviewView({ officers, links }) {
  const pending  = officers.filter(o => o.status === 'pending').length
  const approved = officers.filter(o => o.status === 'approved').length
  const credits  = officers.reduce((s, o) => s + (o.credits || 0), 0)
  const captures = links.reduce((s, l) => s + (l.captures?.length || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
        <StatCard icon={Users}         label="Total Officers"   value={officers.length} />
        <StatCard icon={AlertTriangle} label="Pending Approval" value={pending}  color={P.yellow} />
        <StatCard icon={CheckCircle2}  label="Approved"         value={approved} color={P.green} />
        <StatCard icon={Zap}           label="Total Credits"    value={credits} />
        <StatCard icon={Link2}         label="Tracking Links"   value={links.length} color={P.purple} />
        <StatCard icon={Eye}           label="Total Captures"   value={captures} color={P.red} />
      </div>

      {pending > 0 && (
        <div className="atc" style={{ padding: 20, border: `1px solid ${P.yellow}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={16} color={P.yellow} />
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: P.yellow, letterSpacing: 1 }}>
              {pending} OFFICER{pending > 1 ? 'S' : ''} AWAITING APPROVAL
            </span>
          </div>
          {officers.filter(o => o.status === 'pending').map(o => (
            <div key={o.uid} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: P.surf, borderRadius: 8,
              border: `1px solid ${P.border}`, marginBottom: 8,
            }}>
              <div>
                <div style={{ fontSize: 13, color: P.txt }}>{o.displayName || '—'}</div>
                <div style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{o.email}</div>
              </div>
              <SBadge status="pending" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

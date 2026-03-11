// src/views/OverviewView.jsx
import { Users, AlertTriangle, CheckCircle2, Zap, Link2, Eye } from 'lucide-react'
import { StatCard, SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

export default function OverviewView({ stats, setTab }) {
  if (!stats) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
        <StatCard icon={Users}         label="Total Officers"   value={stats.totalOfficers || 0} onClick={() => setTab('officers')} />
        <StatCard icon={AlertTriangle} label="Pending Approval" value={stats.pending || 0}  color={P.yellow} onClick={() => setTab('officers')} />
        <StatCard icon={CheckCircle2}  label="Approved"         value={stats.approved || 0} color={P.green}  onClick={() => setTab('officers')} />
        <StatCard icon={Zap}           label="Total Credits"    value={stats.totalCredits || 0}           onClick={() => setTab('credits')} />
        <StatCard icon={Link2}         label="Tracking Links"   value={stats.totalLinks || 0} color={P.purple} onClick={() => setTab('links')} />
        <StatCard icon={Eye}           label="Total Captures"   value={stats.totalCaptures || 0} color={P.red}    onClick={() => setTab('links')} />
      </div>
    </div>
  )
}
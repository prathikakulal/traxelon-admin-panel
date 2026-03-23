// // // // src/views/OfficersView.jsx
// // // import { useState, useEffect, useRef } from 'react'
// // // import { Search, CheckCircle2, XCircle, Plus, Minus, Trash2, Download } from 'lucide-react'
// // // import { SBadge } from '../components/UI.jsx'
// // // import { P } from '../styles/theme.js'

// // // export default function OfficersView({ officers, links, onApprove, onReject, onAddCredit, onDeductCredit, onDelete, onLoadMore, hasMore, loadingMore, highlightUid }) {
// // //   const [q, setQ] = useState('')
// // //   const [amt, setAmt] = useState({})
// // //   const [selected, setSelected] = useState(new Set())
// // //   const highlightRef = useRef(null)

// // //   // Scroll highlighted officer into view
// // //   useEffect(() => {
// // //     if (highlightUid && highlightRef.current) {
// // //       highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
// // //     }
// // //   }, [highlightUid])

// // //   const rows = officers.filter(o =>
// // //     (o.displayName || '').toLowerCase().includes(q.toLowerCase()) ||
// // //     (o.email || '').toLowerCase().includes(q.toLowerCase()) ||
// // //     (o.badgeId || '').toLowerCase().includes(q.toLowerCase())
// // //   )

// // //   const handleExport = (data, filename) => {
// // //     if (!data.length) return

// // //     // Define headers
// // //     const headers = ['Name', 'Email', 'Badge ID', 'Status', 'Credits', 'Links Generated', 'Total Captures']

// // //     // Map data to rows
// // //     const csvRows = data.map(o => {
// // //       const officerLinks = (links || []).filter(l => l.uid === o.uid)
// // //       const linksCount = officerLinks.length
// // //       const capturesCount = officerLinks.reduce((acc, l) => acc + (l.captures?.length || 0), 0)

// // //       return [
// // //         `"${(o.displayName || '—').replace(/"/g, '""')}"`,
// // //         `"${(o.email || '—').replace(/"/g, '""')}"`,
// // //         `"${(o.badgeId || '—').replace(/"/g, '""')}"`,
// // //         `"${(o.status || 'approved').toUpperCase()}"`,
// // //         o.credits || 0,
// // //         linksCount,
// // //         capturesCount
// // //       ]
// // //     })

// // //     // Combine into CSV string
// // //     const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')

// // //     // Create download link
// // //     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
// // //     const url = URL.createObjectURL(blob)
// // //     const link = document.createElement('a')
// // //     link.setAttribute('href', url)
// // //     link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
// // //     link.style.visibility = 'hidden'
// // //     document.body.appendChild(link)
// // //     link.click()
// // //     document.body.removeChild(link)
// // //   }

// // //   return (
// // //     <div className="atc" style={{ overflow: 'hidden' }}>
// // //       <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
// // //         <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
// // //           <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
// // //           <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search officers…" className="ati" style={{ paddingLeft: 32, width: '100%' }} />
// // //         </div>
// // //         <span style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace", marginRight: 'auto' }}>{rows.length} results</span>

// // //         <div style={{ display: 'flex', gap: 8 }}>
// // //           <button 
// // //             className="abtn abtn-p" 
// // //             style={{ padding: '6px 12px', fontSize: 12 }} 
// // //             disabled={selected.size === 0}
// // //             onClick={() => handleExport(rows.filter(r => selected.has(r.uid)), 'selected_officers')}
// // //           >
// // //             <Download size={13} /> Extract ({selected.size})
// // //           </button>
// // //           <button 
// // //             className="abtn abtn-g" 
// // //             style={{ padding: '6px 12px', fontSize: 12 }}
// // //             onClick={() => handleExport(rows, 'all_officers')}
// // //           >
// // //             <Download size={13} /> Extract All
// // //           </button>
// // //         </div>
// // //       </div>

// // //       <div style={{ overflowX: 'auto' }}>
// // //         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
// // //           <thead>
// // //             <tr style={{ borderBottom: `1px solid ${P.border}` }}>
// // //               <th style={{ padding: '10px 14px', width: 40 }}>
// // //                 <input 
// // //                   type="checkbox" 
// // //                   style={{ cursor: 'pointer' }}
// // //                   checked={rows.length > 0 && rows.every(r => selected.has(r.uid))}
// // //                   onChange={e => {
// // //                     const next = new Set(selected)
// // //                     rows.forEach(r => e.target.checked ? next.add(r.uid) : next.delete(r.uid))
// // //                     setSelected(next)
// // //                   }}
// // //                 />
// // //               </th>
// // //               {['Officer', 'Badge ID', 'Status', 'Credits', 'Links', 'Captures', 'Actions'].map(h => (
// // //                 <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
// // //               ))}
// // //             </tr>
// // //           </thead>
// // //           <tbody>
// // //             {rows.map(o => {
// // //               const isHighlighted = highlightUid && o.uid === highlightUid
// // //               // Use robust comparison for UID matching
// // //               const officerLinks = (links || []).filter(l => String(l.uid) === String(o.uid))
// // //               const linksCount = officerLinks.length
// // //               const capturesCount = officerLinks.reduce((acc, l) => acc + (l.captures?.length || 0), 0)

// // //               return (
// // //               <tr
// // //                 key={o.uid}
// // //                 ref={isHighlighted ? highlightRef : null}
// // //                 className="atr"
// // //                 style={{
// // //                   borderBottom: `1px solid ${P.border}18`,
// // //                   background: selected.has(o.uid) ? 'rgba(0,212,255,.03)' : 'transparent',
// // //                   ...(isHighlighted ? {
// // //                     background: 'rgba(0,212,255,.07)',
// // //                     outline: `1.5px solid rgba(0,212,255,.45)`,
// // //                     outlineOffset: '-1px',
// // //                     borderRadius: 6,
// // //                   } : {}),
// // //                 }}
// // //               >
// // //                 <td style={{ padding: '12px 14px' }}>
// // //                   <input 
// // //                     type="checkbox" 
// // //                     style={{ cursor: 'pointer' }}
// // //                     checked={selected.has(o.uid)}
// // //                     onChange={() => {
// // //                       const next = new Set(selected)
// // //                       next.has(o.uid) ? next.delete(o.uid) : next.add(o.uid)
// // //                       setSelected(next)
// // //                     }}
// // //                   />
// // //                 </td>
// // //                 <td style={{ padding: '12px 14px' }}>
// // //                   <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
// // //                     <div style={{
// // //                       width: 32, height: 32, borderRadius: 8, flexShrink: 0,
// // //                       background: `${P.cyanD}20`, border: `1px solid ${P.cyan}25`,
// // //                       display: 'flex', alignItems: 'center', justifyContent: 'center',
// // //                       fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: P.cyan,
// // //                     }}>
// // //                       {(o.displayName || '?')[0].toUpperCase()}
// // //                     </div>
// // //                     <div>
// // //                       <div style={{ fontSize: 13, color: P.txt }}>{o.displayName || '—'}</div>
// // //                       <div style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{o.email}</div>
// // //                     </div>
// // //                   </div>
// // //                 </td>
// // //                 <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.txt2 }}>{o.badgeId || '—'}</td>
// // //                 <td style={{ padding: '12px 14px' }}><SBadge status={(!o.status || o.status === 'pending' || o.status === 'approved') ? 'approved' : 'pending'} /></td>
// // //                 <td style={{ padding: '12px 14px' }}>
// // //                   <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
// // //                     <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: P.cyan, fontWeight: 700, minWidth: 24 }}>{o.credits ?? 0}</span>
// // //                     <input
// // //                       type="number" min="1" placeholder="n"
// // //                       value={amt[o.uid] || ''}
// // //                       onChange={e => setAmt(p => ({ ...p, [o.uid]: e.target.value }))}
// // //                       className="ati" style={{ width: 48, padding: '4px 7px', fontSize: 12 }}
// // //                     />
// // //                     <button className="aib" style={{ color: P.green }} onClick={() => { onAddCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Plus size={12} /></button>
// // //                     <button className="aib" style={{ color: P.red }} onClick={() => { onDeductCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Minus size={12} /></button>
// // //                   </div>
// // //                 </td>
// // //                 <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: P.txt2 }}>{linksCount}</td>
// // //                 <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: capturesCount > 0 ? P.green : P.muted }}>{capturesCount}</td>

// // //                 <td style={{ padding: '12px 14px' }}>
// // //                   <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
// // //                     {(!o.status || o.status === 'pending' || o.status === 'approved') && <button className="abtn abtn-y" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onReject(o.uid)}><XCircle size={11} /> Revoke</button>}
// // //                     {o.status === 'rejected' && <button className="abtn abtn-p" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onApprove(o.uid)}><CheckCircle2 size={11} /> Re-approve</button>}
// // //                     <button className="aib" style={{ color: P.red }} onClick={() => onDelete(o.uid)}><Trash2 size={12} /></button>
// // //                   </div>
// // //                 </td>
// // //               </tr>
// // //               )
// // //             })}
// // //             {rows.length === 0 && (
// // //               <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: P.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>No officers found</td></tr>
// // //             )}
// // //           </tbody>
// // //         </table>
// // //       </div>
// // //       {!q && hasMore && (
// // //         <div style={{ padding: '14px', textAlign: 'center', borderTop: `1px solid ${P.border}` }}>
// // //           <button className="abtn abtn-g" disabled={loadingMore} onClick={onLoadMore}>
// // //             {loadingMore ? 'Loading...' : 'Load More Officers'}
// // //           </button>
// // //         </div>
// // //       )}
// // //     </div>
// // //   )
// // // }





// // // src/views/OfficersView.jsx
// // import { useState, useEffect, useRef } from 'react'
// // import { Search, CheckCircle2, XCircle, Plus, Minus, Trash2, Download, FileText, Users } from 'lucide-react'
// // import { SBadge } from '../components/UI.jsx'
// // import { P } from '../styles/theme.js'

// // function formatIST(raw) {
// //   if (!raw) return '—'
// //   const d = new Date(raw)
// //   if (isNaN(d)) return raw
// //   return d.toLocaleString('en-IN', {
// //     timeZone: 'Asia/Kolkata',
// //     day: '2-digit', month: '2-digit', year: 'numeric',
// //     hour: '2-digit', minute: '2-digit', second: '2-digit',
// //     hour12: true,
// //   })
// // }

// // // ── Escape a single CSV cell value ──────────────────────────────────────────
// // function esc(v) {
// //   if (v === null || v === undefined) return '""'
// //   return `"${String(v).replace(/"/g, '""')}"`
// // }

// // // ── Trigger a browser file download ─────────────────────────────────────────
// // function downloadFile(content, filename, mime = 'text/csv;charset=utf-8;') {
// //   const blob = new Blob([content], { type: mime })
// //   const url = URL.createObjectURL(blob)
// //   const a = document.createElement('a')
// //   a.href = url
// //   a.download = filename
// //   a.style.display = 'none'
// //   document.body.appendChild(a)
// //   a.click()
// //   document.body.removeChild(a)
// //   URL.revokeObjectURL(url)
// // }

// // // ── Build a rich multi-section CSV report for one or many officers ───────────
// // function buildReport(officers, links) {
// //   const rows = []
// //   const SEP = ['', '', '', '', '', '', '', '', '', ''] // blank separator row

// //   // ════════════════════════════════════════════════════════
// //   // SECTION 1 — Summary table (one row per officer)
// //   // ════════════════════════════════════════════════════════
// //   rows.push([esc('TRAXELON — OFFICER REPORT'), esc(`Generated: ${formatIST(new Date().toISOString())}`)])
// //   rows.push(SEP)
// //   rows.push([
// //     esc('OFFICER SUMMARY'),
// //   ])
// //   rows.push([
// //     esc('Name'),
// //     esc('Email'),
// //     esc('Badge ID'),
// //     esc('Status'),
// //     esc('Credits'),
// //     esc('Links Generated'),
// //     esc('Total Clicks'),
// //     esc('Total Captures'),
// //     esc('Registered'),
// //   ])

// //   officers.forEach(o => {
// //     const oLinks = (links || []).filter(l => String(l.uid) === String(o.uid))
// //     const totalClicks = oLinks.reduce((a, l) => a + (l.clicks || 0), 0)
// //     const totalCaptures = oLinks.reduce((a, l) => a + (l.captures?.length || 0), 0)
// //     rows.push([
// //       esc(o.displayName || '—'),
// //       esc(o.email || '—'),
// //       esc(o.badgeId || '—'),
// //       esc((o.status || 'approved').toUpperCase()),
// //       esc(o.credits ?? 0),
// //       esc(oLinks.length),
// //       esc(totalClicks),
// //       esc(totalCaptures),
// //       esc(formatIST(o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toISOString() : o.createdAt)),
// //     ])
// //   })

// //   // ════════════════════════════════════════════════════════
// //   // SECTION 2 — Per-officer detailed breakdown
// //   // ════════════════════════════════════════════════════════
// //   officers.forEach(o => {
// //     const oLinks = (links || []).filter(l => String(l.uid) === String(o.uid))

// //     rows.push(SEP)
// //     rows.push(SEP)
// //     rows.push([esc(`── OFFICER: ${o.displayName || o.email || o.uid} ──`)])
// //     rows.push(SEP)

// //     // ── User Details ──
// //     rows.push([esc('USER DETAILS')])
// //     rows.push([esc('Field'), esc('Value')])
// //     rows.push([esc('Full Name'), esc(o.displayName || '—')])
// //     rows.push([esc('Email'), esc(o.email || '—')])
// //     rows.push([esc('Badge ID'), esc(o.badgeId || '—')])
// //     rows.push([esc('UID'), esc(o.uid)])
// //     rows.push([esc('Status'), esc((o.status || 'approved').toUpperCase())])
// //     rows.push([esc('Credits'), esc(o.credits ?? 0)])
// //     rows.push([esc('Credit Granted'), esc(o.creditGranted ? 'Yes' : 'No')])
// //     rows.push([esc('Registered'), esc(formatIST(o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toISOString() : o.createdAt))])
// //     rows.push([esc('Last Seen'), esc(formatIST(o.lastSeen?.seconds ? new Date(o.lastSeen.seconds * 1000).toISOString() : o.lastSeen))])
// //     rows.push(SEP)

// //     // ── Links & Capture History ──
// //     rows.push([esc('LINKS & CAPTURE HISTORY')])

// //     if (oLinks.length === 0) {
// //       rows.push([esc('No links generated yet.')])
// //     } else {
// //       oLinks.forEach((l, li) => {
// //         const captures = l.captures || []
// //         rows.push([
// //           esc(`Link ${li + 1}`),
// //           esc(`Token: /t/${l.token || l.id}`),
// //           esc(`Label: ${l.label || 'Tracking Link'}`),
// //           esc(`Status: ${l.active ? 'ACTIVE' : 'INACTIVE'}`),
// //           esc(`Clicks: ${l.clicks || 0}`),
// //           esc(`Captures: ${captures.length}`),
// //           esc(`Created: ${formatIST(l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toISOString() : l.createdAt)}`),
// //         ])

// //         if (captures.length > 0) {
// //           rows.push([
// //             esc('  #'),
// //             esc('  IP'),
// //             esc('  Location'),
// //             esc('  Device'),
// //             esc('  Browser'),
// //             esc('  OS'),
// //             esc('  ISP'),
// //             esc('  Screen'),
// //             esc('  GPS Address'),
// //             esc('  Captured At'),
// //           ])
// //           captures.forEach((c, ci) => {
// //             rows.push([
// //               esc(`  ${ci + 1}`),
// //               esc(c.ip || '—'),
// //               esc([c.gpsCity || c.city, c.gpsCountry || c.country].filter(Boolean).join(', ') || '—'),
// //               esc(c.device || '—'),
// //               esc(c.browser || '—'),
// //               esc(c.os || '—'),
// //               esc(c.isp || '—'),
// //               esc(c.screenWidth ? `${c.screenWidth}×${c.screenHeight}` : '—'),
// //               esc(c.gpsAddress || c.address || '—'),
// //               esc(formatIST(c.capturedAt)),
// //             ])
// //           })
// //         } else {
// //           rows.push([esc('  No captures for this link.')])
// //         }
// //         rows.push(SEP)
// //       })
// //     }

// //     // ── Credit Summary ──
// //     rows.push([esc('CREDIT DETAILS')])
// //     rows.push([esc('Field'), esc('Value')])
// //     rows.push([esc('Current Credits'), esc(o.credits ?? 0)])
// //     rows.push([esc('Free Credit Issued'), esc(o.creditGranted ? 'Yes (1 credit on approval)' : 'No')])
// //     rows.push([esc('Links Generated'), esc(oLinks.length)])
// //     rows.push([esc('Credits Consumed'), esc(oLinks.length)])  // 1 credit per link
// //     rows.push(SEP)
// //   })

// //   return rows.map(r => r.join(',')).join('\n')
// // }

// // export default function OfficersView({ officers, links, onApprove, onReject, onAddCredit, onDeductCredit, onDelete, onLoadMore, hasMore, loadingMore, highlightUid }) {
// //   const [q, setQ] = useState('')
// //   const [amt, setAmt] = useState({})
// //   const [selected, setSelected] = useState(new Set())
// //   const highlightRef = useRef(null)

// //   useEffect(() => {
// //     if (highlightUid && highlightRef.current) {
// //       highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
// //     }
// //   }, [highlightUid])

// //   const rows = officers.filter(o =>
// //     (o.displayName || '').toLowerCase().includes(q.toLowerCase()) ||
// //     (o.email || '').toLowerCase().includes(q.toLowerCase()) ||
// //     (o.badgeId || '').toLowerCase().includes(q.toLowerCase())
// //   )

// //   // ── Extract selected officers ──────────────────────────────────────────────
// //   const handleExtractSelected = () => {
// //     const targets = rows.filter(r => selected.has(r.uid))
// //     if (!targets.length) return
// //     const csv = buildReport(targets, links)
// //     const names = targets.map(o => o.displayName || o.uid).join('_').slice(0, 40)
// //     const date = new Date().toISOString().split('T')[0]
// //     downloadFile(csv, `officer_report_${names}_${date}.csv`)
// //   }

// //   // ── Extract all visible officers ───────────────────────────────────────────
// //   const handleExtractAll = () => {
// //     if (!rows.length) return
// //     const csv = buildReport(rows, links)
// //     const date = new Date().toISOString().split('T')[0]
// //     downloadFile(csv, `all_officers_report_${date}.csv`)
// //   }

// //   return (
// //     <div className="atc" style={{ overflow: 'hidden' }}>

// //       {/* ── Toolbar ── */}
// //       <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
// //         <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
// //           <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
// //           <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search officers…" className="ati" style={{ paddingLeft: 32, width: '100%' }} />
// //         </div>
// //         <span style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace", marginRight: 'auto' }}>{rows.length} results</span>

// //         <div style={{ display: 'flex', gap: 8 }}>
// //           {/* Extract selected */}
// //           <button
// //             className="abtn abtn-p"
// //             style={{ padding: '6px 12px', fontSize: 12, opacity: selected.size === 0 ? 0.45 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer' }}
// //             disabled={selected.size === 0}
// //             onClick={handleExtractSelected}
// //             title="Select officers using checkboxes, then click to download their full report"
// //           >
// //             <FileText size={13} /> Extract ({selected.size})
// //           </button>

// //           {/* Extract all */}
// //           <button
// //             className="abtn abtn-g"
// //             style={{ padding: '6px 12px', fontSize: 12 }}
// //             onClick={handleExtractAll}
// //             title="Download full report for all officers currently shown"
// //           >
// //             <Users size={13} /> Extract All
// //           </button>
// //         </div>
// //       </div>

// //       {/* ── Table ── */}
// //       <div style={{ overflowX: 'auto' }}>
// //         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
// //           <thead>
// //             <tr style={{ borderBottom: `1px solid ${P.border}` }}>
// //               <th style={{ padding: '10px 14px', width: 40 }}>
// //                 <input
// //                   type="checkbox"
// //                   style={{ cursor: 'pointer' }}
// //                   checked={rows.length > 0 && rows.every(r => selected.has(r.uid))}
// //                   onChange={e => {
// //                     const next = new Set(selected)
// //                     rows.forEach(r => e.target.checked ? next.add(r.uid) : next.delete(r.uid))
// //                     setSelected(next)
// //                   }}
// //                 />
// //               </th>
// //               {['Officer', 'Badge ID', 'Status', 'Credits', 'Links', 'Captures', 'Actions'].map(h => (
// //                 <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
// //               ))}
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {rows.map(o => {
// //               const isHighlighted = highlightUid && o.uid === highlightUid
// //               const officerLinks = (links || []).filter(l => String(l.uid) === String(o.uid))
// //               const linksCount = officerLinks.length
// //               const capturesCount = officerLinks.reduce((acc, l) => acc + (l.captures?.length || 0), 0)

// //               return (
// //                 <tr
// //                   key={o.uid}
// //                   ref={isHighlighted ? highlightRef : null}
// //                   className="atr"
// //                   style={{
// //                     borderBottom: `1px solid ${P.border}18`,
// //                     background: selected.has(o.uid) ? 'rgba(0,212,255,.03)' : 'transparent',
// //                     ...(isHighlighted ? {
// //                       background: 'rgba(0,212,255,.07)',
// //                       outline: `1.5px solid rgba(0,212,255,.45)`,
// //                       outlineOffset: '-1px',
// //                       borderRadius: 6,
// //                     } : {}),
// //                   }}
// //                 >
// //                   <td style={{ padding: '12px 14px' }}>
// //                     <input
// //                       type="checkbox"
// //                       style={{ cursor: 'pointer' }}
// //                       checked={selected.has(o.uid)}
// //                       onChange={() => {
// //                         const next = new Set(selected)
// //                         next.has(o.uid) ? next.delete(o.uid) : next.add(o.uid)
// //                         setSelected(next)
// //                       }}
// //                     />
// //                   </td>

// //                   <td style={{ padding: '12px 14px' }}>
// //                     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
// //                       <div style={{
// //                         width: 32, height: 32, borderRadius: 8, flexShrink: 0,
// //                         background: `${P.cyanD}20`, border: `1px solid ${P.cyan}25`,
// //                         display: 'flex', alignItems: 'center', justifyContent: 'center',
// //                         fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: P.cyan,
// //                       }}>
// //                         {(o.displayName || '?')[0].toUpperCase()}
// //                       </div>
// //                       <div>
// //                         <div style={{ fontSize: 13, color: P.txt }}>{o.displayName || '—'}</div>
// //                         <div style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{o.email}</div>
// //                       </div>
// //                     </div>
// //                   </td>

// //                   <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.txt2 }}>{o.badgeId || '—'}</td>
// //                   <td style={{ padding: '12px 14px' }}><SBadge status={(!o.status || o.status === 'pending' || o.status === 'approved') ? 'approved' : 'pending'} /></td>

// //                   <td style={{ padding: '12px 14px' }}>
// //                     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
// //                       <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: P.cyan, fontWeight: 700, minWidth: 24 }}>{o.credits ?? 0}</span>
// //                       <input
// //                         type="number" min="1" placeholder="n"
// //                         value={amt[o.uid] || ''}
// //                         onChange={e => setAmt(p => ({ ...p, [o.uid]: e.target.value }))}
// //                         className="ati" style={{ width: 48, padding: '4px 7px', fontSize: 12 }}
// //                       />
// //                       <button className="aib" style={{ color: P.green }} onClick={() => { onAddCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Plus size={12} /></button>
// //                       <button className="aib" style={{ color: P.red }} onClick={() => { onDeductCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Minus size={12} /></button>
// //                     </div>
// //                   </td>

// //                   <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: P.txt2 }}>{linksCount}</td>
// //                   <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: capturesCount > 0 ? P.green : P.muted }}>{capturesCount}</td>

// //                   <td style={{ padding: '12px 14px' }}>
// //                     <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
// //                       {(!o.status || o.status === 'pending' || o.status === 'approved') && (
// //                         <button className="abtn abtn-y" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onReject(o.uid)}>
// //                           <XCircle size={11} /> Revoke
// //                         </button>
// //                       )}
// //                       {o.status === 'rejected' && (
// //                         <button className="abtn abtn-p" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onApprove(o.uid)}>
// //                           <CheckCircle2 size={11} /> Re-approve
// //                         </button>
// //                       )}
// //                       <button className="aib" style={{ color: P.red }} onClick={() => onDelete(o.uid)}><Trash2 size={12} /></button>
// //                     </div>
// //                   </td>
// //                 </tr>
// //               )
// //             })}

// //             {rows.length === 0 && (
// //               <tr>
// //                 <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: P.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
// //                   No officers found
// //                 </td>
// //               </tr>
// //             )}
// //           </tbody>
// //         </table>
// //       </div>

// //       {!q && hasMore && (
// //         <div style={{ padding: '14px', textAlign: 'center', borderTop: `1px solid ${P.border}` }}>
// //           <button className="abtn abtn-g" disabled={loadingMore} onClick={onLoadMore}>
// //             {loadingMore ? 'Loading...' : 'Load More Officers'}
// //           </button>
// //         </div>
// //       )}
// //     </div>
// //   )
// // }



// // src/views/OfficersView.jsx
// import { useState, useEffect, useRef } from 'react'
// import { Search, CheckCircle2, XCircle, Plus, Minus, Trash2, FileText, Users } from 'lucide-react'
// import { SBadge } from '../components/UI.jsx'
// import { P } from '../styles/theme.js'

// // ── Date formatter ────────────────────────────────────────────────────────────
// function formatIST(raw) {
//   if (!raw) return '—'
//   let d
//   if (raw?.seconds) d = new Date(raw.seconds * 1000)
//   else if (raw?.toDate) d = raw.toDate()
//   else d = new Date(raw)
//   if (isNaN(d)) return String(raw)
//   return d.toLocaleString('en-IN', {
//     timeZone: 'Asia/Kolkata',
//     day: '2-digit', month: '2-digit', year: 'numeric',
//     hour: '2-digit', minute: '2-digit', second: '2-digit',
//     hour12: true,
//   })
// }

// // ── Trigger browser file download ─────────────────────────────────────────────
// function downloadFile(content, filename, mime = 'text/csv;charset=utf-8;') {
//   const BOM = '\uFEFF' // UTF-8 BOM so Excel reads special chars correctly
//   const blob = new Blob([BOM + content], { type: mime })
//   const url = URL.createObjectURL(blob)
//   const a = document.createElement('a')
//   a.href = url; a.download = filename; a.style.display = 'none'
//   document.body.appendChild(a); a.click()
//   document.body.removeChild(a); URL.revokeObjectURL(url)
// }

// // ── CSV escape ────────────────────────────────────────────────────────────────
// function esc(v) {
//   if (v === null || v === undefined) return '""'
//   return `"${String(v).replace(/"/g, '""')}"`
// }

// // =============================================================================
// // ENHANCED CSV — Extract All
// // =============================================================================
// function buildEnhancedCSV(officers, links) {
//   const rows = []
//   const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })

//   rows.push([esc('TRAXELON OFFICER REPORT'), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc('')])
//   rows.push([esc('Generated: ' + date)])
//   rows.push([esc('Total Officers: ' + officers.length)])
//   rows.push([])

//   // Section 1: Summary
//   rows.push([esc('OFFICER SUMMARY')])
//   rows.push([
//     esc('Name'), esc('Email'), esc('Badge ID'), esc('Status'),
//     esc('Credits'), esc('Links Generated'), esc('Total Clicks'),
//     esc('Total Captures'), esc('Registered'), esc('Last Seen'),
//   ])
//   officers.forEach(o => {
//     const ol = (links || []).filter(l => String(l.uid) === String(o.uid))
//     const clk = ol.reduce((a, l) => a + (l.clicks || 0), 0)
//     const cap = ol.reduce((a, l) => a + (l.captures?.length || 0), 0)
//     rows.push([
//       esc(o.displayName || '—'), esc(o.email || '—'), esc(o.badgeId || '—'),
//       esc((o.status || 'approved').toUpperCase()),
//       esc(o.credits ?? 0), esc(ol.length), esc(clk), esc(cap),
//       esc(formatIST(o.createdAt)), esc(formatIST(o.lastSeen)),
//     ])
//   })

//   rows.push([])
//   rows.push([])

//   // Section 2: Detailed link + capture breakdown
//   rows.push([esc('DETAILED LINK AND CAPTURE BREAKDOWN')])
//   rows.push([
//     esc('Officer Name'), esc('Email'), esc('Link Token'), esc('Link Label'),
//     esc('Link Status'), esc('Clicks'), esc('Total Captures'),
//     esc('Capture #'), esc('IP'), esc('Location'), esc('Device'),
//     esc('Browser'), esc('OS'), esc('ISP'), esc('Screen'),
//     esc('GPS Address'), esc('Captured At'),
//   ])

//   officers.forEach(o => {
//     const ol = (links || []).filter(l => String(l.uid) === String(o.uid))
//     if (ol.length === 0) {
//       rows.push([
//         esc(o.displayName || '—'), esc(o.email || '—'),
//         esc('No links'), esc(''), esc(''), esc(0), esc(0),
//         esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''),
//       ])
//       return
//     }
//     ol.forEach(l => {
//       const caps = l.captures || []
//       if (caps.length === 0) {
//         rows.push([
//           esc(o.displayName || '—'), esc(o.email || '—'),
//           esc('/t/' + (l.token || l.id)), esc(l.label || 'Tracking Link'),
//           esc(l.active ? 'ACTIVE' : 'INACTIVE'),
//           esc(l.clicks || 0), esc(0),
//           esc('No captures'), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''),
//         ])
//       } else {
//         caps.forEach((c, ci) => {
//           rows.push([
//             esc(o.displayName || '—'), esc(o.email || '—'),
//             esc('/t/' + (l.token || l.id)), esc(l.label || 'Tracking Link'),
//             esc(l.active ? 'ACTIVE' : 'INACTIVE'),
//             esc(l.clicks || 0), esc(caps.length),
//             esc(ci + 1),
//             esc(c.ip || '—'),
//             esc([c.gpsCity || c.city, c.gpsCountry || c.country].filter(Boolean).join(', ') || '—'),
//             esc(c.device || '—'), esc(c.browser || '—'), esc(c.os || '—'),
//             esc(c.isp || '—'),
//             esc(c.screenWidth ? (c.screenWidth + 'x' + c.screenHeight) : '—'),
//             esc(c.gpsAddress || c.address || '—'),
//             esc(formatIST(c.capturedAt)),
//           ])
//         })
//       }
//     })
//   })

//   return rows.map(r => r.join(',')).join('\n')
// }

// // =============================================================================
// // PDF REPORT — Individual officer(s) — opens print dialog in new tab
// // =============================================================================
// function generatePDF(officers, links) {
//   const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })

//   const officerSections = officers.map(o => {
//     const ol = (links || []).filter(l => String(l.uid) === String(o.uid))
//     const clk = ol.reduce((a, l) => a + (l.clicks || 0), 0)
//     const cap = ol.reduce((a, l) => a + (l.captures?.length || 0), 0)

//     const linkBlocks = ol.length === 0
//       ? '<p style="color:#64748b;font-size:12px;padding:12px 0">No links generated yet.</p>'
//       : ol.map((l, li) => {
//         const caps = l.captures || []
//         const capTable = caps.length === 0
//           ? '<p style="color:#64748b;font-size:11px;margin:8px 0 0 0;padding:0 14px 14px">No captures recorded for this link.</p>'
//           : `<table class="cap-table">
//                 <thead><tr>
//                   <th>#</th><th>IP</th><th>Location</th>
//                   <th>Device / Browser</th><th>OS</th>
//                   <th>GPS Address</th><th>Captured At</th>
//                 </tr></thead>
//                 <tbody>
//                   ${caps.map((c, ci) => `
//                     <tr class="${ci % 2 === 0 ? 'row-even' : 'row-odd'}">
//                       <td>${ci + 1}</td>
//                       <td><code>${c.ip || '—'}</code></td>
//                       <td>${[c.gpsCity || c.city, c.gpsCountry || c.country].filter(Boolean).join(', ') || '—'}</td>
//                       <td>${c.device || '—'} / ${c.browser || '—'}</td>
//                       <td>${c.os || '—'}</td>
//                       <td style="font-size:10px">${c.gpsAddress || c.address || '—'}</td>
//                       <td style="white-space:nowrap;font-size:10px">${formatIST(c.capturedAt)}</td>
//                     </tr>`).join('')}
//                 </tbody>
//               </table>`

//         return `
//             <div class="link-block">
//               <div class="link-header">
//                 <span class="link-token">/t/${l.token || l.id}</span>
//                 <span class="link-label">${l.label || 'Tracking Link'}</span>
//                 <span class="badge ${l.active ? 'badge-green' : 'badge-red'}">${l.active ? 'ACTIVE' : 'INACTIVE'}</span>
//                 <span class="stat-pill">Clicks: <b>${l.clicks || 0}</b></span>
//                 <span class="stat-pill">Captures: <b>${caps.length}</b></span>
//               </div>
//               ${capTable}
//             </div>`
//       }).join('')

//     return `
//       <div class="officer-page">
//         <div class="page-header">
//           <div class="brand">TRAXELON</div>
//           <div class="report-meta">
//             <span>OFFICER INTELLIGENCE REPORT</span>
//             <span>${date}</span>
//           </div>
//         </div>

//         <div class="section">
//           <div class="section-title">USER DETAILS</div>
//           <div class="identity-grid">
//             <div class="id-card">
//               <div class="avatar">${(o.displayName || '?')[0].toUpperCase()}</div>
//               <div class="id-info">
//                 <div class="id-name">${o.displayName || '—'}</div>
//                 <div class="id-email">${o.email || '—'}</div>
//                 <div class="id-badge">Badge: ${o.badgeId || '—'}</div>
//               </div>
//               <div class="status-chip ${(o.status || 'approved') === 'rejected' ? 'chip-red' : 'chip-green'}">
//                 ${(o.status || 'APPROVED').toUpperCase()}
//               </div>
//             </div>
//             <div class="detail-grid">
//               <div class="detail-item"><div class="dl">UID</div><div class="dv"><code>${o.uid}</code></div></div>
//               <div class="detail-item"><div class="dl">Registered</div><div class="dv">${formatIST(o.createdAt)}</div></div>
//               <div class="detail-item"><div class="dl">Last Seen</div><div class="dv">${formatIST(o.lastSeen)}</div></div>
//               <div class="detail-item"><div class="dl">Free Credit Issued</div><div class="dv">${o.creditGranted ? 'Yes' : 'No'}</div></div>
//             </div>
//           </div>
//         </div>

//         <div class="section">
//           <div class="section-title">CREDIT DETAILS</div>
//           <div class="stats-row">
//             <div class="stat-box">
//               <div class="stat-val cyan">${o.credits ?? 0}</div>
//               <div class="stat-lbl">Current Credits</div>
//             </div>
//             <div class="stat-box">
//               <div class="stat-val">${ol.length}</div>
//               <div class="stat-lbl">Links Generated</div>
//             </div>
//             <div class="stat-box">
//               <div class="stat-val">${clk}</div>
//               <div class="stat-lbl">Total Clicks</div>
//             </div>
//             <div class="stat-box">
//               <div class="stat-val ${cap > 0 ? 'green' : ''}">${cap}</div>
//               <div class="stat-lbl">Total Captures</div>
//             </div>
//           </div>
//         </div>

//         <div class="section">
//           <div class="section-title">LINKS &amp; CAPTURE HISTORY</div>
//           ${linkBlocks}
//         </div>

//         <div class="page-footer">
//           TRAXELON Admin &bull; Confidential &bull; ${date}
//         </div>
//       </div>`
//   }).join('<div class="page-break"></div>')

//   const html = `<!DOCTYPE html>
// <html>
// <head>
// <meta charset="UTF-8"/>
// <title>Traxelon Officer Report</title>
// <style>
//   @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;600;700&display=swap');
//   * { box-sizing: border-box; margin: 0; padding: 0; }
//   body { background: #0a0f1e; color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 13px; line-height: 1.5; }

//   @media print {
//     body { background: #fff !important; color: #111 !important; }
//     .page-break { page-break-after: always; }
//     .officer-page { padding: 24px !important; }
//     .brand { color: #0891b2 !important; -webkit-print-color-adjust: exact; }
//     .section-title { color: #0891b2 !important; border-color: #0891b2 !important; }
//     .link-token { color: #0891b2 !important; }
//     .cyan { color: #0891b2 !important; }
//     .green { color: #16a34a !important; }
//     .badge-green { background: #dcfce7 !important; color: #15803d !important; -webkit-print-color-adjust: exact; }
//     .badge-red { background: #fee2e2 !important; color: #b91c1c !important; -webkit-print-color-adjust: exact; }
//     .chip-green { background: #dcfce7 !important; color: #15803d !important; -webkit-print-color-adjust: exact; }
//     .chip-red { background: #fee2e2 !important; color: #b91c1c !important; -webkit-print-color-adjust: exact; }
//     .link-block { border-color: #e2e8f0 !important; }
//     .link-header { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
//     .stat-box { background: #f8fafc !important; border-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; }
//     .identity-grid { background: #f8fafc !important; border-color: #e2e8f0 !important; }
//     .detail-grid { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
//     .avatar { background: #0891b2 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
//     .page-header { border-color: #0891b2 !important; }
//     .page-footer { border-color: #e2e8f0 !important; color: #64748b !important; }
//     .cap-table th { background: #1e293b !important; color: #fff !important; -webkit-print-color-adjust: exact; }
//     .row-even { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
//     .row-odd { background: #fff !important; }
//     code { background: #e0f2fe !important; color: #0891b2 !important; -webkit-print-color-adjust: exact; }
//     .id-name { color: #0f172a !important; }
//     .report-meta { color: #475569 !important; }
//     .stat-lbl { color: #475569 !important; }
//     .id-email, .id-badge { color: #475569 !important; }
//   }

//   .officer-page { max-width: 960px; margin: 0 auto; padding: 36px 40px; }

//   .page-header {
//     display: flex; justify-content: space-between; align-items: center;
//     border-bottom: 2px solid #00d4ff; padding-bottom: 14px; margin-bottom: 28px;
//   }
//   .brand { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; color: #00d4ff; letter-spacing: 4px; }
//   .report-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b; letter-spacing: 1px; }

//   .section { margin-bottom: 28px; }
//   .section-title { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #00d4ff; letter-spacing: 3px; text-transform: uppercase; border-left: 3px solid #00d4ff; padding-left: 10px; margin-bottom: 14px; }

//   .identity-grid { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; display: flex; gap: 24px; flex-wrap: wrap; }
//   .id-card { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 260px; }
//   .avatar { width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg, #00d4ff, #0088aa); display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; color: #0a0f1e; flex-shrink: 0; }
//   .id-name { font-size: 18px; font-weight: 700; color: #f1f5f9; margin-bottom: 2px; }
//   .id-email { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b; margin-bottom: 4px; }
//   .id-badge { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #94a3b8; }
//   .status-chip { padding: 5px 12px; border-radius: 20px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 1px; flex-shrink: 0; }
//   .chip-green { background: rgba(0,212,100,.15); color: #00d464; border: 1px solid rgba(0,212,100,.3); }
//   .chip-red { background: rgba(255,59,48,.15); color: #ff3b30; border: 1px solid rgba(255,59,48,.3); }
//   .detail-grid { background: #111827; border-radius: 8px; padding: 14px 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex: 1; min-width: 260px; }
//   .detail-item .dl { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #475569; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; }
//   .detail-item .dv { font-size: 12px; color: #cbd5e1; }
//   code { font-family: 'JetBrains Mono', monospace; font-size: 10px; background: rgba(0,212,255,.08); color: #00d4ff; padding: 2px 6px; border-radius: 4px; word-break: break-all; }

//   .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
//   .stat-box { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; text-align: center; }
//   .stat-val { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #cbd5e1; line-height: 1; margin-bottom: 6px; }
//   .stat-val.cyan { color: #00d4ff; }
//   .stat-val.green { color: #00d464; }
//   .stat-lbl { font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; }

//   .link-block { border: 1px solid #1e293b; border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
//   .link-header { background: #0f172a; padding: 10px 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
//   .link-token { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #00d4ff; }
//   .link-label { font-size: 12px; color: #94a3b8; flex: 1; }
//   .badge { padding: 3px 8px; border-radius: 12px; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 1px; }
//   .badge-green { background: rgba(0,212,100,.15); color: #00d464; }
//   .badge-red { background: rgba(255,59,48,.15); color: #ff3b30; }
//   .stat-pill { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b; background: #1e293b; padding: 3px 8px; border-radius: 8px; }

//   .cap-table { width: 100%; border-collapse: collapse; font-size: 11px; }
//   .cap-table th { background: #1e293b; padding: 8px 10px; text-align: left; font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; }
//   .cap-table td { padding: 8px 10px; border-bottom: 1px solid #0f172a; color: #cbd5e1; vertical-align: top; }
//   .row-even { background: #0a0f1e; }
//   .row-odd { background: #0d1526; }

//   .page-footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #1e293b; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #334155; letter-spacing: 1px; }
//   .page-break { height: 0; }
// </style>
// </head>
// <body>
//   ${officerSections}
//   <script>window.onload = function() { window.print() }<\/script>
// </body>
// </html>`

//   const win = window.open('', '_blank', 'width=1100,height=800')
//   if (win) { win.document.write(html); win.document.close() }
// }

// // =============================================================================
// // COMPONENT
// // =============================================================================
// export default function OfficersView({ officers, links, onApprove, onReject, onAddCredit, onDeductCredit, onDelete, onLoadMore, hasMore, loadingMore, highlightUid }) {
//   const [q, setQ] = useState('')
//   const [amt, setAmt] = useState({})
//   const [selected, setSelected] = useState(new Set())
//   const highlightRef = useRef(null)

//   useEffect(() => {
//     if (highlightUid && highlightRef.current) {
//       highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
//     }
//   }, [highlightUid])

//   const rows = officers.filter(o =>
//     (o.displayName || '').toLowerCase().includes(q.toLowerCase()) ||
//     (o.email || '').toLowerCase().includes(q.toLowerCase()) ||
//     (o.badgeId || '').toLowerCase().includes(q.toLowerCase())
//   )

//   const handleExtractSelected = () => {
//     const targets = rows.filter(r => selected.has(r.uid))
//     if (!targets.length) return
//     generatePDF(targets, links)
//   }

//   const handleExtractAll = () => {
//     if (!rows.length) return
//     const csv = buildEnhancedCSV(rows, links)
//     const date = new Date().toISOString().split('T')[0]
//     downloadFile(csv, `all_officers_report_${date}.csv`)
//   }

//   return (
//     <div className="atc" style={{ overflow: 'hidden' }}>

//       {/* Toolbar */}
//       <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
//         <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
//           <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
//           <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search officers…" className="ati" style={{ paddingLeft: 32, width: '100%' }} />
//         </div>
//         <span style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace", marginRight: 'auto' }}>{rows.length} results</span>

//         <div style={{ display: 'flex', gap: 8 }}>
//           <button
//             className="abtn abtn-p"
//             style={{ padding: '6px 14px', fontSize: 12, opacity: selected.size === 0 ? 0.45 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
//             disabled={selected.size === 0}
//             onClick={handleExtractSelected}
//             title="Tick checkboxes then click to generate a PDF report for selected officers"
//           >
//             <FileText size={13} /> PDF Report ({selected.size})
//           </button>

//           <button
//             className="abtn abtn-g"
//             style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
//             onClick={handleExtractAll}
//             title="Download full CSV of all officers with links and captures"
//           >
//             <Users size={13} /> Extract All (CSV)
//           </button>
//         </div>
//       </div>

//       {/* Table */}
//       <div style={{ overflowX: 'auto' }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//           <thead>
//             <tr style={{ borderBottom: `1px solid ${P.border}` }}>
//               <th style={{ padding: '10px 14px', width: 40 }}>
//                 <input
//                   type="checkbox"
//                   style={{ cursor: 'pointer' }}
//                   checked={rows.length > 0 && rows.every(r => selected.has(r.uid))}
//                   onChange={e => {
//                     const next = new Set(selected)
//                     rows.forEach(r => e.target.checked ? next.add(r.uid) : next.delete(r.uid))
//                     setSelected(next)
//                   }}
//                 />
//               </th>
//               {['Officer', 'Badge ID', 'Status', 'Credits', 'Links', 'Captures', 'Actions'].map(h => (
//                 <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map(o => {
//               const isHighlighted = highlightUid && o.uid === highlightUid
//               const officerLinks = (links || []).filter(l => String(l.uid) === String(o.uid))
//               const linksCount = officerLinks.length
//               const capturesCount = officerLinks.reduce((acc, l) => acc + (l.captures?.length || 0), 0)

//               return (
//                 <tr
//                   key={o.uid}
//                   ref={isHighlighted ? highlightRef : null}
//                   className="atr"
//                   style={{
//                     borderBottom: `1px solid ${P.border}18`,
//                     background: selected.has(o.uid) ? 'rgba(0,212,255,.03)' : 'transparent',
//                     ...(isHighlighted ? {
//                       background: 'rgba(0,212,255,.07)',
//                       outline: `1.5px solid rgba(0,212,255,.45)`,
//                       outlineOffset: '-1px',
//                       borderRadius: 6,
//                     } : {}),
//                   }}
//                 >
//                   <td style={{ padding: '12px 14px' }}>
//                     <input
//                       type="checkbox"
//                       style={{ cursor: 'pointer' }}
//                       checked={selected.has(o.uid)}
//                       onChange={() => {
//                         const next = new Set(selected)
//                         next.has(o.uid) ? next.delete(o.uid) : next.add(o.uid)
//                         setSelected(next)
//                       }}
//                     />
//                   </td>
//                   <td style={{ padding: '12px 14px' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                       <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${P.cyanD}20`, border: `1px solid ${P.cyan}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: P.cyan }}>
//                         {(o.displayName || '?')[0].toUpperCase()}
//                       </div>
//                       <div>
//                         <div style={{ fontSize: 13, color: P.txt }}>{o.displayName || '—'}</div>
//                         <div style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{o.email}</div>
//                       </div>
//                     </div>
//                   </td>
//                   <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.txt2 }}>{o.badgeId || '—'}</td>
//                   <td style={{ padding: '12px 14px' }}><SBadge status={(!o.status || o.status === 'pending' || o.status === 'approved') ? 'approved' : 'pending'} /></td>
//                   <td style={{ padding: '12px 14px' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//                       <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: P.cyan, fontWeight: 700, minWidth: 24 }}>{o.credits ?? 0}</span>
//                       <input type="number" min="1" placeholder="n" value={amt[o.uid] || ''} onChange={e => setAmt(p => ({ ...p, [o.uid]: e.target.value }))} className="ati" style={{ width: 48, padding: '4px 7px', fontSize: 12 }} />
//                       <button className="aib" style={{ color: P.green }} onClick={() => { onAddCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Plus size={12} /></button>
//                       <button className="aib" style={{ color: P.red }} onClick={() => { onDeductCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Minus size={12} /></button>
//                     </div>
//                   </td>
//                   <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: P.txt2 }}>{linksCount}</td>
//                   <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: capturesCount > 0 ? P.green : P.muted }}>{capturesCount}</td>
//                   <td style={{ padding: '12px 14px' }}>
//                     <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
//                       {(!o.status || o.status === 'pending' || o.status === 'approved') && (
//                         <button className="abtn abtn-y" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onReject(o.uid)}><XCircle size={11} /> Revoke</button>
//                       )}
//                       {o.status === 'rejected' && (
//                         <button className="abtn abtn-p" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onApprove(o.uid)}><CheckCircle2 size={11} /> Re-approve</button>
//                       )}
//                       <button className="aib" style={{ color: P.red }} onClick={() => onDelete(o.uid)}><Trash2 size={12} /></button>
//                     </div>
//                   </td>
//                 </tr>
//               )
//             })}
//             {rows.length === 0 && (
//               <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: P.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>No officers found</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {!q && hasMore && (
//         <div style={{ padding: '14px', textAlign: 'center', borderTop: `1px solid ${P.border}` }}>
//           <button className="abtn abtn-g" disabled={loadingMore} onClick={onLoadMore}>
//             {loadingMore ? 'Loading...' : 'Load More Officers'}
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }





// src/views/OfficersView.jsx
import { useState, useEffect, useRef } from 'react'
import { Search, CheckCircle2, XCircle, Plus, Minus, Trash2, FileText, Users } from 'lucide-react'
import { SBadge } from '../components/UI.jsx'
import { P } from '../styles/theme.js'

// ── Date formatter ────────────────────────────────────────────────────────────
function formatIST(raw) {
  if (!raw) return '—'
  let d
  if (raw?.seconds) d = new Date(raw.seconds * 1000)
  else if (raw?._seconds) d = new Date(raw._seconds * 1000)
  else if (raw?.toDate) d = raw.toDate()
  else d = new Date(raw)
  if (isNaN(d)) return String(raw)
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true,
  })
}

// ── Trigger browser file download ─────────────────────────────────────────────
function downloadFile(content, filename, mime = 'text/csv;charset=utf-8;') {
  const BOM = '\uFEFF' // UTF-8 BOM so Excel reads special chars correctly
  const blob = new Blob([BOM + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.style.display = 'none'
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ── CSV escape ────────────────────────────────────────────────────────────────
function esc(v) {
  if (v === null || v === undefined) return '""'
  return `"${String(v).replace(/"/g, '""')}"`
}

// =============================================================================
// ENHANCED CSV — Extract All
// =============================================================================
function buildEnhancedCSV(officers, links) {
  const rows = []
  const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })

  rows.push([esc('TRAXELON OFFICER REPORT'), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc('')])
  rows.push([esc('Generated: ' + date)])
  rows.push([esc('Total Officers: ' + officers.length)])
  rows.push([])

  // Section 1: Summary
  rows.push([esc('OFFICER SUMMARY')])
  rows.push([
    esc('Name'), esc('Email'), esc('Badge ID'), esc('Status'),
    esc('Credits'), esc('Links Generated'), esc('Total Clicks'),
    esc('Total Captures'), esc('Registered'), esc('Last Seen'),
  ])
  officers.forEach(o => {
    const ol = (links || []).filter(l => String(l.uid) === String(o.uid))
    const clk = ol.reduce((a, l) => a + (l.clicks || 0), 0)
    const cap = ol.reduce((a, l) => a + (l.captures?.length || 0), 0)
    rows.push([
      esc(o.displayName || '—'), esc(o.email || '—'), esc(o.badgeId || '—'),
      esc((o.status || 'approved').toUpperCase()),
      esc(o.credits ?? 0), esc(ol.length), esc(clk), esc(cap),
      esc(formatIST(o.createdAt)), esc(formatIST(o.lastSeen)),
    ])
  })

  rows.push([])
  rows.push([])

  // Section 2: Detailed link + capture breakdown
  rows.push([esc('DETAILED LINK AND CAPTURE BREAKDOWN')])
  rows.push([
    esc('Officer Name'), esc('Email'), esc('Link Token'), esc('Link Label'),
    esc('Link Status'), esc('Clicks'), esc('Total Captures'),
    esc('Capture #'), esc('IP'), esc('Location'), esc('Device'),
    esc('Browser'), esc('OS'), esc('ISP'), esc('Screen'),
    esc('GPS Address'), esc('Captured At'),
  ])

  officers.forEach(o => {
    const ol = (links || []).filter(l => String(l.uid) === String(o.uid))
    if (ol.length === 0) {
      rows.push([
        esc(o.displayName || '—'), esc(o.email || '—'),
        esc('No links'), esc(''), esc(''), esc(0), esc(0),
        esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''),
      ])
      return
    }
    ol.forEach(l => {
      const caps = l.captures || []
      if (caps.length === 0) {
        rows.push([
          esc(o.displayName || '—'), esc(o.email || '—'),
          esc('/t/' + (l.token || l.id)), esc(l.label || 'Tracking Link'),
          esc(l.active ? 'ACTIVE' : 'INACTIVE'),
          esc(l.clicks || 0), esc(0),
          esc('No captures'), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''), esc(''),
        ])
      } else {
        caps.forEach((c, ci) => {
          rows.push([
            esc(o.displayName || '—'), esc(o.email || '—'),
            esc('/t/' + (l.token || l.id)), esc(l.label || 'Tracking Link'),
            esc(l.active ? 'ACTIVE' : 'INACTIVE'),
            esc(l.clicks || 0), esc(caps.length),
            esc(ci + 1),
            esc(c.ip || '—'),
            esc([c.gpsCity || c.city, c.gpsCountry || c.country].filter(Boolean).join(', ') || '—'),
            esc(c.device || '—'), esc(c.browser || '—'), esc(c.os || '—'),
            esc(c.isp || '—'),
            esc(c.screenWidth ? (c.screenWidth + 'x' + c.screenHeight) : '—'),
            esc(c.gpsAddress || c.address || '—'),
            esc(formatIST(c.capturedAt)),
          ])
        })
      }
    })
  })

  return rows.map(r => r.join(',')).join('\n')
}

// =============================================================================
// PDF REPORT — Individual officer(s) — opens print dialog in new tab
// =============================================================================
function generatePDF(officers, links) {
  const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

  const officerSections = officers.map(o => {
    const ol = (links || []).filter(l => String(l.uid) === String(o.uid))
    const clk = ol.reduce((a, l) => a + (l.clicks || 0), 0)
    const cap = ol.reduce((a, l) => a + (l.captures?.length || 0), 0)

    const linkBlocks = ol.length === 0
      ? '<div class="empty-state">No links generated yet.</div>'
      : ol.map((l, li) => {
        const caps = l.captures || []
        const capTable = caps.length === 0
          ? '<div class="empty-table">No captures recorded for this link.</div>'
          : `<table class="cap-table">
                <thead><tr>
                  <th style="width:30px">#</th>
                  <th style="width:100px">IP</th>
                  <th style="width:120px">Location</th>
                  <th style="width:140px">Device / Browser</th>
                  <th style="width:80px">OS</th>
                  <th>GPS Address</th>
                  <th style="width:120px;text-align:right;">Captured At</th>
                </tr></thead>
                <tbody>
                  ${caps.map((c, ci) => {
                    let locStr = '—'
                    if (c.location && typeof c.location === 'object') {
                      locStr = [c.location.city, c.location.country].filter(Boolean).join(', ')
                    } else if (typeof c.location === 'string' && c.location.trim()) {
                      locStr = c.location
                    } else {
                      locStr = [c.city, c.country].filter(Boolean).join(', ') || '—'
                    }

                    const ip = c.ip || '—'
                    const deviceBrowser = [c.device, c.browser].filter(Boolean).join(' / ') || '—'
                    const os = c.os || '—'
                    const gpsAddressStr = c.gpsAddress || c.address || '—'
                    const capturedAtStr = formatIST(c.capturedAt || c.createdAt)

                    return `
                    <tr>
                      <td class="muted">${ci + 1}</td>
                      <td><span class="code">${ip}</span></td>
                      <td>${locStr}</td>
                      <td><div class="truncate" style="max-width:130px" title="${deviceBrowser}">${deviceBrowser}</div></td>
                      <td>${os}</td>
                      <td><div style="word-break: break-word; max-width: 250px;">${gpsAddressStr}</div></td>
                      <td class="muted" style="text-align:right;">${capturedAtStr}</td>
                    </tr>`
                  }).join('')}
                </tbody>
              </table>`

        return `
            <div class="link-card">
              <div class="link-header">
                <div class="link-info">
                  <span class="link-token">/t/${l.token || l.id}</span>
                  <span class="link-label">${l.label || 'Tracking Link'}</span>
                  <span class="chip ${l.active ? 'chip-green' : 'chip-red'}">${l.active ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <div class="link-stats">
                  <span>Clicks: <b class="text-dark">${l.clicks || 0}</b></span>
                  <span>Captures: <b class="text-dark">${caps.length}</b></span>
                </div>
              </div>
              <div class="table-wrapper">
                ${capTable}
              </div>
            </div>`
      }).join('')

    return `
      <div class="page">
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <div class="brand">TRAXELON</div>
            <div class="report-title">Officer Activity Report</div>
          </div>
          <div class="header-right">
            <div class="report-date">${date}</div>
            <div class="report-admin">Generated by Admin</div>
          </div>
        </div>

        <!-- User Profile Card -->
        <div class="profile-card">
          <div class="profile-avatar">${(o.displayName || '?')[0].toUpperCase()}</div>
          <div class="profile-info">
            <div class="profile-name">${o.displayName || 'Unknown Officer'}</div>
            <div class="profile-email">${o.email || '—'}</div>
          </div>
          <div class="profile-meta">
            <div><span class="meta-lbl">Badge ID:</span> <span class="meta-val">${o.badgeId || '—'}</span></div>
            <div><span class="meta-lbl">Registered:</span> <span class="meta-val">${formatIST(o.createdAt)}</span></div>
            <div><span class="meta-lbl">UID:</span> <span class="meta-val code">${o.uid}</span></div>
          </div>
        </div>

        <!-- Stats Section -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-num text-cyan">${o.credits ?? 0}</div>
            <div class="stat-lbl">Current Credits</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">${ol.length}</div>
            <div class="stat-lbl">Links Generated</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">${clk}</div>
            <div class="stat-lbl">Total Clicks</div>
          </div>
          <div class="stat-card">
            <div class="stat-num stat-green">${cap}</div>
            <div class="stat-lbl">Total Captures</div>
          </div>
        </div>

        <!-- Tracking Links -->
        <div class="section-title">TRACKING LINKS & CAPTURES</div>
        <div class="links-container">
          ${linkBlocks}
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>TRAXELON Admin &bull; Confidential &bull; SaaS Export</div>
          <div class="page-number"></div>
        </div>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Traxelon Officer Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  
  :root {
    --bg: #ffffff;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --border-light: #f1f5f9;
    --primary: #0284c7;
    --primary-light: #e0f2fe;
    --success: #16a34a;
    --success-light: #dcfce7;
    --danger: #dc2626;
    --danger-light: #fee2e2;
    --card-bg: #f8fafc;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body { 
    background: #f1f5f9; 
    color: var(--text-main); 
    font-family: 'Inter', sans-serif; 
    font-size: 11px; 
    line-height: 1.5; 
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Page layout */
  .page {
    background: var(--bg);
    width: 210mm;
    min-height: 297mm;
    margin: 20px auto;
    padding: 20mm;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border-radius: 8px;
    position: relative;
    page-break-after: always;
  }

  @media print {
    body { background: var(--bg); }
    .page { 
        margin: 0; padding: 10mm; 
        box-shadow: none; border-radius: 0; 
        width: auto; min-height: auto;
    }
    .footer { position: fixed; bottom: 0; width: 100%; border-top: 1px solid var(--border); padding-top: 16px; background: white;}
    .link-card { page-break-inside: avoid; }
    tr { page-break-inside: avoid; }
    
    @page {
        margin: 10mm;
        size: A4;
    }
  }

  /* Typography */
  .text-dark { color: var(--text-main); font-weight: 600; }
  .text-cyan { color: var(--primary); }
  .stat-green { color: var(--success); }
  .muted { color: var(--text-muted); }
  .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; vertical-align: bottom; }
  .code { font-family: 'JetBrains Mono', monospace; font-size: 10px; background: var(--border-light); padding: 2px 4px; border-radius: 4px; color: var(--text-muted); }

  /* Header */
  .header {
    display: flex; justify-content: space-between; align-items: flex-end;
    border-bottom: 2px solid var(--border);
    padding-bottom: 16px; margin-bottom: 24px;
  }
  .header-left { display: flex; flex-direction: column; gap: 4px; }
  .brand { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; color: var(--primary); letter-spacing: 2px; line-height: 1; }
  .report-title { font-size: 14px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
  
  .header-right { text-align: right; display: flex; flex-direction: column; gap: 4px; }
  .report-date { font-weight: 600; font-size: 12px; color: var(--text-main); }
  .report-admin { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

  /* Profile Card */
  .profile-card {
    display: flex; align-items: center; gap: 20px;
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; margin-bottom: 24px;
  }
  .profile-avatar {
    width: 64px; height: 64px; border-radius: 12px;
    background: var(--primary-light); color: var(--primary);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
    flex-shrink: 0;
  }
  .profile-info { flex: 1; }
  .profile-name { font-size: 20px; font-weight: 700; color: var(--text-main); line-height: 1.2; margin-bottom: 4px; }
  .profile-email { font-size: 13px; color: var(--text-muted); }
  
  .profile-meta { display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 0 20px; border-left: 1px solid var(--border); border-right: 1px solid var(--border); }
  .meta-lbl { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 70px; }
  .meta-val { font-weight: 600; color: var(--text-main); }
  
  .profile-status { padding-left: 10px; display: flex; align-items: center; justify-content: center; min-width: 100px; }
  
  /* Chips */
  .chip { padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 1px; display: inline-block; }
  .chip-green { background: var(--success-light); color: var(--success); border: 1px solid rgba(22, 163, 74, 0.2); }
  .chip-red { background: var(--danger-light); color: var(--danger); border: 1px solid rgba(220, 38, 38, 0.2); }

  /* Stats Grid */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .stat-num { font-size: 28px; font-weight: 700; font-family: 'JetBrains Mono', monospace; line-height: 1; margin-bottom: 6px; color: var(--text-main); }
  .stat-lbl { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }

  /* Sections */
  .section-title { font-size: 12px; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }

  /* Link Cards */
  .links-container { display: flex; flex-direction: column; gap: 16px; }
  .link-card { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  .link-header { background: var(--card-bg); padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .link-info { display: flex; align-items: center; gap: 12px; }
  .link-token { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--primary); font-size: 13px; }
  .link-label { font-size: 12px; color: var(--text-muted); }
  .link-stats { display: flex; gap: 16px; font-size: 11px; color: var(--text-muted); padding-top: 2px;}
  
  /* Table */
  .table-wrapper { padding: 0; }
  .cap-table { width: 100%; border-collapse: collapse; text-align: left; }
  .cap-table th { padding: 10px 16px; font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); background: var(--bg); }
  .cap-table td { padding: 10px 16px; border-bottom: 1px solid var(--border-light); vertical-align: middle; color: var(--text-main); font-size: 11px; }
  .cap-table tbody tr:nth-child(even) { background: #fafbfc; }
  .cap-table tbody tr:last-child td { border-bottom: none; }
  .empty-table, .empty-state { padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px; font-style: italic; }

  /* Footer */
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
</style>
</head>
<body>
  <div class="report-wrapper">
    ${officerSections}
  </div>
  <script>
    window.onload = function() { 
      setTimeout(() => { window.print(); }, 500); 
    };
  </script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1100,height=900')
  if (win) {
    const htmlWithPrintBtn = html.replace(
      '<body>',
      `<body>
      <div style="position:fixed;top:16px;right:16px;z-index:9999;display:flex;gap:8px;" class="no-print">
        <style>@media print { .no-print { display: none !important; } }</style>
        <button onclick="window.print()" style="background:#0284c7;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          PRINT / SAVE PDF
        </button>
        <button onclick="window.close()" style="background:#fff;color:#64748b;border:1px solid #e2e8f0;padding:9px 16px;border-radius:8px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.05);">
          CLOSE
        </button>
      </div>`
    )
    win.document.write(htmlWithPrintBtn)
    win.document.close()
  }
}


  // =============================================================================
  // COMPONENT
  // =============================================================================
  export default function OfficersView({ officers, links, onApprove, onReject, onAddCredit, onDeductCredit, onDelete, onLoadMore, hasMore, loadingMore, highlightUid }) {
    const [q, setQ] = useState('')
    const [amt, setAmt] = useState({})
    const [selected, setSelected] = useState(new Set())
    const highlightRef = useRef(null)

    useEffect(() => {
      if (highlightUid && highlightRef.current) {
        highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, [highlightUid])

    const rows = officers.filter(o =>
      (o.displayName || '').toLowerCase().includes(q.toLowerCase()) ||
      (o.email || '').toLowerCase().includes(q.toLowerCase()) ||
      (o.badgeId || '').toLowerCase().includes(q.toLowerCase())
    )

    const handleExtractSelected = () => {
      const targets = rows.filter(r => selected.has(r.uid))
      if (!targets.length) return
      generatePDF(targets, links)
    }

    const handleExtractAll = () => {
      if (!rows.length) return
      const csv = buildEnhancedCSV(rows, links)
      const date = new Date().toISOString().split('T')[0]
      downloadFile(csv, `all_officers_report_${date}.csv`)
    }

    return (
      <div className="atc" style={{ overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
            <Search size={13} color={P.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search officers…" className="ati" style={{ paddingLeft: 32, width: '100%' }} />
          </div>
          <span style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace", marginRight: 'auto' }}>{rows.length} results</span>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="abtn abtn-p"
              style={{ padding: '6px 14px', fontSize: 12, opacity: selected.size === 0 ? 0.45 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              disabled={selected.size === 0}
              onClick={handleExtractSelected}
              title="Tick checkboxes then click to generate a PDF report for selected officers"
            >
              <FileText size={13} /> PDF Report ({selected.size})
            </button>

            <button
              className="abtn abtn-g"
              style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleExtractAll}
              title="Download full CSV of all officers with links and captures"
            >
              <Users size={13} /> Extract All (CSV)
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                <th style={{ padding: '10px 14px', width: 40 }}>
                  <input
                    type="checkbox"
                    style={{ cursor: 'pointer' }}
                    checked={rows.length > 0 && rows.every(r => selected.has(r.uid))}
                    onChange={e => {
                      const next = new Set(selected)
                      rows.forEach(r => e.target.checked ? next.add(r.uid) : next.delete(r.uid))
                      setSelected(next)
                    }}
                  />
                </th>
                {['Officer', 'Badge ID', 'Status', 'Credits', 'Links', 'Captures', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: P.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(o => {
                const isHighlighted = highlightUid && o.uid === highlightUid
                const officerLinks = (links || []).filter(l => String(l.uid) === String(o.uid))
                const linksCount = officerLinks.length
                const capturesCount = officerLinks.reduce((acc, l) => acc + (l.captures?.length || 0), 0)

                return (
                  <tr
                    key={o.uid}
                    ref={isHighlighted ? highlightRef : null}
                    className="atr"
                    style={{
                      borderBottom: `1px solid ${P.border}18`,
                      background: selected.has(o.uid) ? 'rgba(0,212,255,.03)' : 'transparent',
                      ...(isHighlighted ? {
                        background: 'rgba(0,212,255,.07)',
                        outline: `1.5px solid rgba(0,212,255,.45)`,
                        outlineOffset: '-1px',
                        borderRadius: 6,
                      } : {}),
                    }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <input
                        type="checkbox"
                        style={{ cursor: 'pointer' }}
                        checked={selected.has(o.uid)}
                        onChange={() => {
                          const next = new Set(selected)
                          next.has(o.uid) ? next.delete(o.uid) : next.add(o.uid)
                          setSelected(next)
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${P.cyanD}20`, border: `1px solid ${P.cyan}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: P.cyan }}>
                          {(o.displayName || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: P.txt }}>{o.displayName || '—'}</div>
                          <div style={{ fontSize: 11, color: P.muted, fontFamily: "'JetBrains Mono',monospace" }}>{o.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.txt2 }}>{o.badgeId || '—'}</td>
                    <td style={{ padding: '12px 14px' }}><SBadge status={(!o.status || o.status === 'pending' || o.status === 'approved') ? 'approved' : 'pending'} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: P.cyan, fontWeight: 700, minWidth: 24 }}>{o.credits ?? 0}</span>
                        <input type="number" min="1" placeholder="n" value={amt[o.uid] || ''} onChange={e => setAmt(p => ({ ...p, [o.uid]: e.target.value }))} className="ati" style={{ width: 48, padding: '4px 7px', fontSize: 12 }} />
                        <button className="aib" style={{ color: P.green }} onClick={() => { onAddCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Plus size={12} /></button>
                        <button className="aib" style={{ color: P.red }} onClick={() => { onDeductCredit(o.uid, parseInt(amt[o.uid] || 1)); setAmt(p => ({ ...p, [o.uid]: '' })) }}><Minus size={12} /></button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: P.txt2 }}>{linksCount}</td>
                    <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: capturesCount > 0 ? P.green : P.muted }}>{capturesCount}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {(!o.status || o.status === 'pending' || o.status === 'approved') && (
                          <button className="abtn abtn-y" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onReject(o.uid)}><XCircle size={11} /> Revoke</button>
                        )}
                        {o.status === 'rejected' && (
                          <button className="abtn abtn-p" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => onApprove(o.uid)}><CheckCircle2 size={11} /> Re-approve</button>
                        )}
                        <button className="aib" style={{ color: P.red }} onClick={() => onDelete(o.uid)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: P.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>No officers found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!q && hasMore && (
          <div style={{ padding: '14px', textAlign: 'center', borderTop: `1px solid ${P.border}` }}>
            <button className="abtn abtn-g" disabled={loadingMore} onClick={onLoadMore}>
              {loadingMore ? 'Loading...' : 'Load More Officers'}
            </button>
          </div>
        )}
      </div>
    )
  }

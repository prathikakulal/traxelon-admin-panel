// src/styles/theme.js
export const P = {
  bg: '#0A0F1E',
  surf: '#0F1729',
  card: '#131D35',
  border: '#1E2D4F',
  cyan: '#00D4FF',
  cyanD: '#0099BB',
  red: '#FF3B30',
  txt: '#F0F4FF',
  txt2: '#8A9BC5',
  muted: '#4A5A80',
  yellow: '#F59E0B',
  green: '#34D399',
  purple: '#A78BFA',
  orange: '#FB923C',
}

export const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  html,body,#root{height:100%;background:#0A0F1E;margin:0;padding:0;font-family:'DM Sans',sans-serif;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:#0F1729;}
  ::-webkit-scrollbar-thumb{background:#1E2D4F;border-radius:4px;}
  ::-webkit-scrollbar-thumb:hover{background:#00D4FF;}
  .atc{background:#131D35;border:1px solid #1E2D4F;border-radius:12px;}
  .ati{background:#0F1729;border:1px solid #1E2D4F;border-radius:8px;color:#F0F4FF;padding:8px 12px;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .2s;}
  .ati:focus{border-color:#00D4FF;}
  .ati::placeholder{color:#4A5A80;}
  .abtn{display:inline-flex;align-items:center;gap:6px;border-radius:8px;padding:7px 14px;font-size:12px;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;border:none;transition:all .2s;white-space:nowrap;}
  .abtn-p{background:linear-gradient(135deg,#00D4FF,#0099BB);color:#0A0F1E;}
  .abtn-p:hover{opacity:.88;}
  .abtn-g{background:transparent;color:#8A9BC5;border:1px solid #1E2D4F!important;}
  .abtn-g:hover{border-color:#00D4FF!important;color:#00D4FF;}
  .abtn-r{background:rgba(255,59,48,.1);color:#FF3B30;border:1px solid rgba(255,59,48,.3)!important;}
  .abtn-r:hover{background:rgba(255,59,48,.2);}
  .abtn-y{background:rgba(245,158,11,.1);color:#F59E0B;border:1px solid rgba(245,158,11,.3)!important;}
  .abtn-y:hover{background:rgba(245,158,11,.2);}
  .abtn-gr{background:rgba(52,211,153,.1);color:#34D399;border:1px solid rgba(52,211,153,.3)!important;}
  .abtn-gr:hover{background:rgba(52,211,153,.2);}
  .aib{width:28px;height:28px;border-radius:6px;background:transparent;border:1px solid #1E2D4F;color:#4A5A80;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;}
  .aib:hover{background:rgba(255,255,255,.04);color:#F0F4FF;}
  .anav{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;border:none;background:transparent;width:100%;font-family:'DM Sans',sans-serif;font-size:13px;color:#4A5A80;text-align:left;transition:all .15s;}
  .anav:hover{background:rgba(0,212,255,.06);color:#8A9BC5;}
  .anav.aon{background:rgba(0,212,255,.1);color:#00D4FF;}
  .atr:hover td{background:rgba(0,212,255,.02);}
  .ascan{position:fixed;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(0,212,255,.5),transparent);animation:ascanAnim 5s linear infinite;z-index:9999;pointer-events:none;}
  @keyframes ascanAnim{0%{transform:translateY(0);}100%{transform:translateY(100vh);}}

  .al-root{min-height:100vh;background:#0a0d12;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;}
  .al-card{width:420px;background:#111520;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:48px 48px 44px;box-shadow:0 0 0 1px rgba(0,0,0,0.4),0 40px 80px rgba(0,0,0,0.5);}
  .al-brand{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;}
  .al-brand-bar{width:3px;height:38px;background:#00e5ff;border-radius:2px;flex-shrink:0;margin-top:3px;}
  .al-brand-text{font-size:32px;font-weight:400;letter-spacing:3px;color:#ffffff;line-height:1.1;font-family:'Bebas Neue',cursive;}
  .al-subtitle{font-size:13px;color:rgba(255,255,255,0.35);font-weight:400;margin-bottom:36px;padding-left:13px;font-family:'DM Sans',sans-serif;}
  .al-error{display:flex;align-items:flex-start;gap:8px;background:rgba(255,59,48,0.08);border:1px solid rgba(255,59,48,0.2);border-radius:8px;padding:10px 13px;font-size:12px;color:#ff6b6b;margin-bottom:14px;animation:errIn .2s ease;font-family:'DM Sans',sans-serif;}
  @keyframes errIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}
  .al-fields{display:flex;flex-direction:column;gap:14px;}
  .al-input-wrap{position:relative;}
  .al-input{width:100%;background:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px 18px;font-family:'DM Sans',sans-serif;font-size:14px;color:rgba(255,255,255,0.75);outline:none;transition:border-color .2s,box-shadow .2s;}
  .al-input::placeholder{color:rgba(255,255,255,0.25);}
  .al-input:focus{border-color:rgba(0,229,255,0.4);box-shadow:0 0 0 3px rgba(0,229,255,0.07);}
  .al-input.has-icon{padding-right:46px;}
  .al-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.25);display:flex;align-items:center;padding:4px;transition:color .15s;}
  .al-eye:hover{color:rgba(255,255,255,0.5);}
  .al-btn{width:100%;margin-top:28px;padding:16px;background:#00e5ff;border:none;border-radius:10px;font-family:'Bebas Neue',cursive;font-size:15px;font-weight:400;letter-spacing:3px;text-transform:uppercase;color:#0a0d12;cursor:pointer;transition:opacity .2s,transform .15s,box-shadow .2s;box-shadow:0 0 28px rgba(0,229,255,0.2);display:flex;align-items:center;justify-content:center;gap:8px;}
  .al-btn:hover{opacity:.9;box-shadow:0 0 40px rgba(0,229,255,0.35);}
  .al-btn:active{transform:scale(.985);}
  .al-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .al-spinner{width:14px;height:14px;border:2px solid rgba(10,13,18,0.3);border-top-color:#0a0d12;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-7px);}40%{transform:translateX(7px);}60%{transform:translateX(-4px);}80%{transform:translateX(4px);}}
  .al-shaking{animation:shake .35s ease;}
  
  /* Mobile Responsiveness */
  .layout-wrapper { display: flex; height: 100vh; overflow: hidden; font-family: 'DM Sans', sans-serif; }
  .sidebar { 
    flex-shrink: 0; display: flex; flex-direction: column; transition: transform 0.3s ease, width 0.25s ease;
    overflow: hidden; height: 100%; z-index: 100;
  }
  .sidebar.open { width: 218px; }
  .sidebar.closed { width: 62px; }
  
  .mobile-overlay { display: none; position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; backdrop-filter: blur(2px); }
  
  @media (max-width: 768px) {
    .sidebar { position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); }
    .sidebar.open { width: 240px; transform: translateX(0); }
    .sidebar.closed { transform: translateX(-100%); }
    .mobile-overlay.open { display: block; }
  }

  /* ── Header mobile-only datetime (hidden on desktop) ── */
  .header-mobile-dt { display: none; }

  /* ── Header mobile tweaks ── */
  @media (max-width: 600px) {
    .header-clock { display: none; }
    .header-divider { display: none; }
    .admin-header { padding: 0 12px !important; gap: 8px !important; }
    .header-pending {
      padding: 4px 8px !important;
      gap: 4px !important;
    }
    .header-pending span {
      font-size: 10px !important;
    }
    /* Hide email under admin name — too long on mobile */
    .header-email { display: none; }
    /* Keep profile text block but prevent overflow */
    .header-profile-text { max-width: 70px; overflow: hidden; }
    .header-profile-text > div:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* Show date+time block in header centre */
    .header-mobile-dt {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1px;
    }
    .header-mobile-time {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #F0F4FF;
      line-height: 1.1;
    }
    .header-mobile-date {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #4A5A80;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
`
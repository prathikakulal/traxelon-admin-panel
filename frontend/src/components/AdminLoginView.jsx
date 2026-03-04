// src/components/AdminLoginView.jsx
import { useState } from 'react'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { db, auth } from '../firebase/config.js'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export default function AdminLoginView({ onLoginSuccess }) {
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [showPw, setShow]   = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoad]  = useState(false)
  const [shaking, setShake] = useState(false)

  const shake = () => { setShake(true); setTimeout(() => setShake(false), 400) }

  const handleLogin = async () => {
    setError('')
    if (!email.trim() || !pass) {
      setError('Please enter your email and password.')
      shake(); return
    }
    setLoad(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (!snap.exists() || !snap.data().isAdmin) {
        await signOut(auth)
        setError('Access denied. Admins only.')
        shake(); setLoad(false); return
      }
      onLoginSuccess(snap.data())
    } catch (e) {
      const msgs = {
        'auth/user-not-found':     'No account found with this email.',
        'auth/wrong-password':     'Incorrect password. Please try again.',
        'auth/invalid-email':      'Please enter a valid email address.',
        'auth/too-many-requests':  'Too many attempts. Try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      }
      setError(msgs[e.code] || 'Login failed. Please try again.')
      shake()
    }
    setLoad(false)
  }

  const onKey = (e) => { if (e.key === 'Enter') handleLogin() }

  return (
    <div className="al-root">
      <div className={`al-card${shaking ? ' al-shaking' : ''}`}>
        <div className="al-brand">
          <div className="al-brand-bar" />
          <div className="al-brand-text">TRAXELON</div>
        </div>
        <div className="al-subtitle">Admin Access Required</div>

        {error && (
          <div className="al-error">
            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <div className="al-fields">
          <div className="al-input-wrap">
            <input
              type="email"
              className="al-input"
              placeholder="Admin email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={onKey}
              autoComplete="username"
            />
          </div>
          <div className="al-input-wrap">
            <input
              type={showPw ? 'text' : 'password'}
              className="al-input has-icon"
              placeholder="Password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={onKey}
              autoComplete="current-password"
            />
            <button className="al-eye" onClick={() => setShow(v => !v)} tabIndex={-1} type="button">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button className="al-btn" onClick={handleLogin} disabled={loading}>
          {loading
            ? <><div className="al-spinner" /> AUTHENTICATING…</>
            : 'ACCESS PANEL'
          }
        </button>
      </div>
    </div>
  )
}

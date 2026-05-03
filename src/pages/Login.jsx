import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', schoolName: '' })
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    if (isSignUp) {
      const { error } = await signUp(form.email, form.password, form.fullName, form.schoolName)
      if (error) { toast.error(error.message); setLoading(false); return }
      toast.success('Account created! Check your email to confirm.')
    } else {
      const { error } = await signIn(form.email, form.password)
      if (error) { toast.error(error.message); setLoading(false); return }
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      {/* Left Panel */}
      <div className="login-left">
        <div style={{zIndex:1}}>
          <div style={{fontSize:48, marginBottom:16}}>🏫</div>
          <h1>Manage your school<br/>with confidence.</h1>
          <p>The all-in-one platform for Ugandan schools to track students, fees, attendance and performance — all in one place.</p>
          <div className="login-features">
            {['Student enrollment & records','Fee tracking & payment status','Daily attendance management','Dashboard analytics & insights'].map(f => (
              <div key={f} className="login-feature">
                <span className="login-feature-dot"></span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-card">
          <div className="brand">
            <div className="brand-icon">🏫</div>
            <span className="brand-name">Skool Manager</span>
          </div>

          <h2>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
          <p className="subtitle">{isSignUp ? 'Set up your school in minutes.' : 'Sign in to your school dashboard.'}</p>

          <form onSubmit={submit}>
            {isSignUp && (
              <>
                <div className="form-group">
                  <label>School Name</label>
                  <input name="schoolName" placeholder="e.g. Kampala Junior School" onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>Your Full Name</label>
                  <input name="fullName" placeholder="e.g. Bwambale Robert" onChange={handle} required />
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" placeholder="you@school.ac.ug" onChange={handle} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" placeholder="••••••••" onChange={handle} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="login-switch">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
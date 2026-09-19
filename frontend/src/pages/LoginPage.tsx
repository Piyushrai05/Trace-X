import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo@tracex.io')
  const [password, setPassword] = useState('demo')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('tracex_auth', 'true')
      navigate('/')
    }, 600)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-cyan/20 rounded flex items-center justify-center text-cyan font-bold text-xl mb-4">TX</div>
          <h1 className="text-2xl font-bold text-text">TraceX</h1>
          <p className="text-muted text-sm mt-1">Supply Chain Command Center</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-cyan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-cyan"
            />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Access Command Center
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

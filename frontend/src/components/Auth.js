import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

const providers = [
  { id: 'google', label: 'Google' },
]

export default function Auth({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else onAuth(data.user)
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else onAuth(data.user)
    setLoading(false)
  }

  const handleOAuthLogin = async (provider) => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({ provider })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign in to SmartShort</h2>

        {/* Email Login */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        {error && <div className="text-red-600 text-sm mb-4 text-center">{error}</div>}

        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition disabled:opacity-60 flex items-center justify-center"
          >
            {loading ? <span className="loader mr-2"></span> : null}
            Sign In
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded border border-gray-300 transition disabled:opacity-60"
          >
            Sign Up
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-3 text-gray-500 font-semibold">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* OAuth Providers */}
        <div className="flex flex-col gap-3">
          {providers.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleOAuthLogin(id)}
              disabled={loading}
              className="w-full border border-gray-300 rounded py-2 flex items-center justify-center gap-2 hover:bg-gray-100 transition disabled:opacity-60"
            >
              <ProviderIcon provider={id} />
              Continue with {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loader CSS */}
      <style>{`
        .loader {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function ProviderIcon({ provider }) {
  switch (provider) {
    case 'google':
      return (
        <svg width="18" height="18" viewBox="0 0 533.5 544.3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M533.5 278.4c0-18.3-1.6-36-4.7-53.1H272v100.6h146.8c-6.3 33.9-25.1 62.7-53.5 82v68.2h86.4c50.6-46.6 79.8-115.4 79.8-197.7z"/>
          <path fill="#34A853" d="M272 544.3c72.9 0 134-24.2 178.7-65.7l-86.4-68.2c-24.1 16.2-55 25.8-92.3 25.8-70.9 0-131-47.9-152.4-112.3H31.3v70.6C74.9 489.4 166.3 544.3 272 544.3z"/>
          <path fill="#FBBC04" d="M119.6 324.2c-5.3-15.9-8.3-32.8-8.3-50.2 0-17.4 3-34.3 8.3-50.2v-70.6H31.3C11.5 191.1 0 230.7 0 272s11.5 80.9 31.3 114.6l88.3-62.4z"/>
          <path fill="#EA4335" d="M272 107.7c39.5 0 75 13.6 103 40.5l77.1-77.1C399.8 24.7 336.4 0 272 0 166.3 0 74.9 54.9 31.3 137.4l88.3 62.4c21.4-64.4 81.5-112.1 152.4-112.1z"/>
        </svg>
      )
    default:
      return null
  }
}

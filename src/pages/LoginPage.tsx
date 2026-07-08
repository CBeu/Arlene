import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import './LoginPage.css'

type EmailStatus = 'idle' | 'sending' | 'sent' | 'error'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      // BASE_URL respects the Vite `base` setting, so this works on
      // localhost and on GitHub Pages (/REPO-NAME/) alike
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
    if (error) setErrorMsg(error.message)
  }

  const signInWithEmail = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setEmailStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
    if (error) {
      setEmailStatus('error')
      setErrorMsg(error.message)
    } else {
      setEmailStatus('sent')
    }
  }

  return (
    <main className="login">
      {/* Topographic backdrop — decorative only */}
      <svg className="login-topo" aria-hidden="true" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M-40 520 C 160 430, 240 560, 420 480 S 720 520, 860 430" />
          <path d="M-40 470 C 150 380, 260 500, 430 430 S 700 470, 860 380" />
          <path d="M-40 420 C 140 340, 280 440, 440 380 S 680 420, 860 330" />
          <path d="M-40 160 C 120 240, 300 90, 470 170 S 720 120, 860 200" />
          <path d="M-40 110 C 130 190, 310 50, 480 120 S 700 70, 860 150" />
          <path d="M-40 60 C 140 140, 320 10, 490 70 S 680 30, 860 100" />
        </g>
      </svg>

      <section className="login-card" aria-labelledby="login-title">
        <svg className="login-pin" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
          />
        </svg>

        <h1 id="login-title">Arlene</h1>
        <p className="login-sub">Annual Reunion Location Electronic Network Election</p>

        <div className="login-buttons">
          <button
            type="button"
            className="btn btn-apple"
            onClick={() => signInWithProvider('apple')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M16.98 12.99c.03 3.1 2.72 4.13 2.75 4.14-.02.07-.43 1.47-1.42 2.91-.86 1.25-1.75 2.49-3.15 2.52-1.38.03-1.82-.82-3.4-.82-1.57 0-2.06.79-3.36.85-1.35.05-2.38-1.35-3.25-2.59C3.39 17.46 2.03 12.83 3.85 9.7c.9-1.55 2.52-2.54 4.27-2.56 1.33-.03 2.58.9 3.4.9.8 0 2.33-1.11 3.93-.95.67.03 2.55.27 3.76 2.04-.1.06-2.25 1.31-2.23 3.86ZM14.4 4.4c.71-.87 1.2-2.07 1.06-3.27-1.03.04-2.28.69-3.02 1.55-.66.77-1.24 2-1.09 3.17 1.15.09 2.33-.58 3.05-1.45Z"
              />
            </svg>
            Continue with Apple
          </button>

          <button
            type="button"
            className="btn btn-google"
            onClick={() => signInWithProvider('google')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.09A12 12 0 0 0 12 24Z" />
              <path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.63H1.29a12 12 0 0 0 0 10.74l4-3.09Z" />
              <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.29 6.63l4 3.09C6.23 6.88 8.88 4.77 12 4.77Z" />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="login-divider" role="separator">or</div>

        {emailStatus === 'sent' ? (
          <p className="login-sent" role="status">
            Sign-in link sent to <strong>{email}</strong>. Open it on this
            device to finish signing in.
          </p>
        ) : (
          <form className="login-email" onSubmit={signInWithEmail}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-email"
              disabled={emailStatus === 'sending'}
            >
              {emailStatus === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}

        {errorMsg && (
          <p className="login-error" role="alert">
            {errorMsg}
          </p>
        )}
      </section>
    </main>
  )
}

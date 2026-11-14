'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/leaderboard';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address.');
    if (!agree) return setError('Please confirm you are 18 or over and agree to the rules.');
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) return setError(error.message.includes('rate') ? 'Too many attempts. Please wait a minute and try again.' : "We couldn't send your code. Please try again.");
    setStage('code');
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const token = code.replace(/\D/g, '');
    if (token.length !== 6) return setError('Enter the 6-digit code from your email.');
    setBusy(true);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' });
    if (error || !data.user) { setBusy(false); return setError('That code is wrong or has expired. Check the latest email, or send a new code.'); }
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.user.id).maybeSingle();
    router.replace(profile ? next : `/onboarding${next !== '/leaderboard' ? `?next=${encodeURIComponent(next)}` : ''}`);
    router.refresh();
  }

  return (
    <div className="auth-card">
      <a href="/" aria-label="SPOTY home"><img src="/assets/spoty-logo-horizontal.svg" alt="SPOTY" width={150} height={42} style={{ filter: 'none', background: 'var(--navy)', padding: '8px 12px', borderRadius: 8 }} /></a>
      {stage === 'email' ? (
        <form onSubmit={sendCode} className="stack" style={{ marginTop: 22 }}>
          <div>
            <p className="eyebrow">Sales Person of the Year 2027</p>
            <h1 style={{ marginTop: 6 }}>Sell me this vote.</h1>
            <p className="muted" style={{ marginTop: 6 }}>Join free or sign in. We'll email you a 6-digit code, so there's no password to remember.</p>
          </div>
          <label className="f">Work or personal email
            <input className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus />
          </label>
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span className="small muted">I'm 18 or over and agree to the <a href="/rules" target="_blank">SPOTY rules</a> and <a href="/privacy" target="_blank">privacy policy</a>.</span>
          </label>
          {error ? <p className="alert alert-err" role="alert">{error}</p> : null}
          <button className="btn btn-gold btn-block" disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="stack" style={{ marginTop: 22 }}>
          <div>
            <p className="eyebrow">Check your inbox</p>
            <h1 style={{ marginTop: 6 }}>Enter your code</h1>
            <p className="muted" style={{ marginTop: 6 }}>We sent a 6-digit code to <b>{email}</b>. It can take a minute, so check spam too.</p>
          </div>
          <input className="input code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" autoFocus aria-label="6-digit code" />
          {error ? <p className="alert alert-err" role="alert">{error}</p> : null}
          <button className="btn btn-gold btn-block" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
          <div className="row spread small">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setStage('email'); setCode(''); setError(''); }}>Use another email</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => sendCode()}>Send a new code</button>
          </div>
        </form>
      )}
    </div>
  );
}

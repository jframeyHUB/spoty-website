'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import { friendlyError } from '@/lib/util';

export default function VoteBox({ candidateId, firstName, handle, signedIn, hasProfile, alreadyVoted, freeUsed }:
  { candidateId: string; firstName: string; handle: string; signedIn: boolean; hasProfile: boolean; alreadyVoted: boolean; freeUsed: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function vote() {
    setBusy(true); setError('');
    const { error } = await supabaseBrowser().rpc('cast_member_vote', { p_candidate: candidateId, p_message: message.trim() || null });
    setBusy(false);
    if (error) return setError(friendlyError(error.message));
    setDone(true);
    router.refresh();
  }

  if (alreadyVoted || done) {
    return (
      <div className="card card-pad stack" style={{ borderTop: '3px solid var(--gold)' }}>
        <p className="eyebrow">Vote counted</p>
        <h2>You voted for {firstName}</h2>
        <p className="muted small">Thanks. You can vote for each salesperson once per year. Want to climb too?</p>
        <Link href="/get-votes" className="btn btn-navy btn-block">Get votes for yourself</Link>
      </div>
    );
  }

  if (!signedIn || !hasProfile) {
    const next = encodeURIComponent(`/v/${handle}`);
    return (
      <div className="card card-pad stack" style={{ borderTop: '3px solid var(--gold)' }}>
        <p className="eyebrow">Sales Person of the Year 2027</p>
        <h2>Vote for {firstName}</h2>
        <p className="muted small">Are you in sales too? Create your free SPOTY profile and your first vote is on us.</p>
        <Link href={signedIn ? `/onboarding?next=${next}` : `/login?next=${next}`} className="btn btn-gold btn-block">{signedIn ? 'Finish your profile to vote' : 'Join free and vote'}</Link>
        <div className="alert alert-info small">Not in sales? Voting for £0.99 opens very soon. Come back to this link to vote for {firstName}.</div>
      </div>
    );
  }

  if (freeUsed) {
    return (
      <div className="card card-pad stack" style={{ borderTop: '3px solid var(--gold)' }}>
        <h2>Vote for {firstName}</h2>
        <p className="muted small">You've already used your free vote this year. Paid votes (£0.99 each, one per salesperson) open very soon.</p>
        <button className="btn btn-gold btn-block" disabled>Vote for £0.99 · coming soon</button>
      </div>
    );
  }

  return (
    <div className="card card-pad stack" style={{ borderTop: '3px solid var(--gold)' }}>
      <p className="eyebrow">Your free vote</p>
      <h2>Vote for {firstName}</h2>
      <p className="muted small">Every member gets one free vote a year. Use it on someone who's earned it.</p>
      <label className="f">Add a message <span className="hint">Optional. {firstName} will see it.</span>
        <textarea className="input" maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Why does ${firstName} deserve it?`} />
        <span className="count">{message.length}/300</span>
      </label>
      {error ? <p className="alert alert-err" role="alert">{error}</p> : null}
      <button className="btn btn-gold btn-block" onClick={vote} disabled={busy}>{busy ? 'Voting…' : `Use my free vote on ${firstName}`}</button>
    </div>
  );
}

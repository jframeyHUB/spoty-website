'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function SettingsActions() {
  const router = useRouter();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace('/');
    router.refresh();
  }

  async function deleteProfile() {
    setBusy(true); setError('');
    const supabase = supabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').delete().eq('id', user!.id);
    if (error) { setBusy(false); return setError("We couldn't delete your profile. Please email sales@spoty.club."); }
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-line" onClick={signOut} style={{ width: 'fit-content' }}>Sign out</button>
      <section className="card card-pad stack" style={{ borderColor: '#F1C0BA' }}>
        <h2>Delete your profile</h2>
        <p className="muted small">This removes your profile, your photo from the leaderboard and all votes you've received. It can't be undone. Type <b>DELETE</b> to confirm.</p>
        <input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Type DELETE to confirm" />
        {error ? <p className="alert alert-err">{error}</p> : null}
        <button className="btn btn-danger" disabled={confirm !== 'DELETE' || busy} onClick={deleteProfile} style={{ width: 'fit-content' }}>{busy ? 'Deleting…' : 'Delete my profile'}</button>
      </section>
    </>
  );
}

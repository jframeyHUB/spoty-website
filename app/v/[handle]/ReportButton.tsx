'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon from '@/components/Icon';

const REASONS: [string, string][] = [['fake', 'Fake profile'], ['impersonation', 'Pretending to be someone else'], ['offensive', 'Offensive photo or words'], ['spam', 'Spam'], ['other', 'Something else']];

export default function ReportButton({ profileId, name }: { profileId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('fake');
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');

  async function send() {
    setState('busy');
    const supabase = supabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('reports').insert({ reporter_id: user?.id, profile_id: profileId, reason, details: details.trim() || null });
    setState(error ? 'error' : 'sent');
  }

  if (!open) return <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)} aria-label={`Report ${name}`}><Icon name="flag" size={16} />Report</button>;

  return (
    <div role="dialog" aria-label={`Report ${name}`} style={{ position: 'fixed', inset: 0, background: 'rgba(15,39,66,0.5)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card card-pad stack" style={{ width: '100%', maxWidth: 420 }}>
        {state === 'sent' ? (
          <>
            <h2>Thanks for telling us</h2>
            <p className="muted small">Our team will review {name}'s profile. We don't tell them who reported it.</p>
            <button className="btn btn-navy" onClick={() => setOpen(false)}>Close</button>
          </>
        ) : (
          <>
            <h2>Report {name}</h2>
            {REASONS.map(([v, l]) => (
              <label key={v} className="check"><input type="radio" name="reason" checked={reason === v} onChange={() => setReason(v)} />{l}</label>
            ))}
            <textarea className="input" maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Anything else we should know? (optional)" />
            {state === 'error' ? <p className="alert alert-err">That didn't send. Please try again.</p> : null}
            <div className="row"><button className="btn btn-navy" onClick={send} disabled={state === 'busy'}>Send report</button><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button></div>
          </>
        )}
      </div>
    </div>
  );
}

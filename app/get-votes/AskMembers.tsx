'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import { friendlyError } from '@/lib/util';

type Member = { id: string; handle: string; first_name: string; last_name: string; photo_url: string | null; country: string; job_title: string | null };

export default function AskMembers({ myId, initialLeft }: { myId: string; initialLeft: number }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [left, setLeft] = useState(initialLeft);
  const [asked, setAsked] = useState<Record<string, string>>({});

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const like = `%${term.replace(/[%_,()]/g, '')}%`;
      const { data } = await supabase.from('profiles')
        .select('id, handle, first_name, last_name, photo_url, country, job_title')
        .or(`first_name.ilike.${like},last_name.ilike.${like},handle.ilike.${like},company.ilike.${like}`)
        .neq('id', myId).limit(8);
      setResults((data as Member[]) || []);
    }, 300);
    return () => clearTimeout(t);
  }, [q, supabase, myId]);

  async function ask(m: Member) {
    setAsked((a) => ({ ...a, [m.id]: 'busy' }));
    const { data, error } = await supabase.rpc('request_vote', { p_to: m.id });
    if (error) return setAsked((a) => ({ ...a, [m.id]: friendlyError(error.message) }));
    setLeft(Number(data));
    setAsked((a) => ({ ...a, [m.id]: 'sent' }));
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members by name or company" aria-label="Search members" />
      {left <= 0 ? <p className="alert alert-info small">You've used your 3 requests for today. More tomorrow.</p> : null}
      {results.map((m) => {
        const s = asked[m.id];
        return (
          <div key={m.id} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
            <Avatar p={m} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="lb-name">{m.first_name} {m.last_name}</div>
              <div className="lb-sub">{s && s !== 'busy' && s !== 'sent' ? <span style={{ color: 'var(--err)' }}>{s}</span> : m.job_title}</div>
            </div>
            {s === 'sent'
              ? <span className="pill">Asked</span>
              : <button className="btn btn-line btn-sm" disabled={s === 'busy' || left <= 0} onClick={() => ask(m)}>{s === 'busy' ? 'Asking…' : 'Ask for vote'}</button>}
          </div>
        );
      })}
      {q.trim().length >= 2 && results.length === 0 ? <p className="soft small">No members found.</p> : null}
    </div>
  );
}

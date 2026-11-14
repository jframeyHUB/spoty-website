import Link from 'next/link';
import { requireProfile } from '@/lib/supabase/server';
import Shell from '@/components/Shell';
import Avatar from '@/components/Avatar';

export const metadata = { title: 'Notifications' };
export const dynamic = 'force-dynamic';

type Note = {
  id: number; type: string; data: { message?: string; text?: string }; read_at: string | null; created_at: string;
  actor: { handle: string; first_name: string; last_name: string; photo_url: string | null; country: string } | null;
};

function when(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default async function Notifications() {
  const { supabase, profile } = await requireProfile('/notifications');
  const { data } = await supabase.from('notifications')
    .select('id, type, data, read_at, created_at, actor:profiles!notifications_actor_id_fkey(handle, first_name, last_name, photo_url, country)')
    .order('created_at', { ascending: false }).limit(50);
  const notes = (data || []) as unknown as Note[];
  // Opening the page marks everything as read.
  if (notes.some((n) => !n.read_at)) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);

  return (
    <Shell profile={{ ...profile }}>
      <div className="narrow" style={{ margin: '0 auto' }}>
        <section className="card">
          <div className="card-head"><h1 style={{ fontSize: 20 }}>Notifications</h1></div>
          {notes.length === 0 ? <p className="empty">Nothing yet. When someone votes for you or asks for your vote, you'll see it here.</p> : notes.map((n) => {
            const who = n.actor ? `${n.actor.first_name} ${n.actor.last_name}` : 'Someone';
            return (
              <div key={n.id} className={`note${n.read_at ? '' : ' unread'}`}>
                {n.actor ? <Avatar p={n.actor} size={44} /> : <span className="av" style={{ width: 44, height: 44 }}>★</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {n.type === 'vote' ? <p><b>{who}</b> voted for you.</p>
                    : n.type === 'request' ? <p><b>{who}</b> asked for your vote.</p>
                    : <p>{n.data?.text}</p>}
                  {n.data?.message ? <p className="muted small" style={{ marginTop: 4, fontStyle: 'italic' }}>“{n.data.message}”</p> : null}
                  {n.type === 'request' && n.actor ? <Link href={`/v/${n.actor.handle}`} className="btn btn-gold btn-sm" style={{ marginTop: 8 }}>Vote for {n.actor.first_name}</Link> : null}
                  {n.type === 'vote' && n.actor ? <Link href={`/v/${n.actor.handle}`} className="soft small" style={{ display: 'inline-block', marginTop: 6 }}>Vote back</Link> : null}
                </div>
                <span className="soft small">{when(n.created_at)}</span>
              </div>
            );
          })}
        </section>
      </div>
    </Shell>
  );
}

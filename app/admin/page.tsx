import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/supabase/server';
import Shell from '@/components/Shell';
import Avatar from '@/components/Avatar';
import { AdminMemberActions, AdminReportActions } from './AdminActions';
import { countryName } from '@/lib/countries';

export const metadata = { title: 'Admin' };
export const dynamic = 'force-dynamic';

type Member = { id: string; handle: string; first_name: string; last_name: string; photo_url: string | null; country: string; status: string; created_at: string; job_title: string | null };
type Report = { id: number; reason: string; details: string | null; status: string; created_at: string; profile: Member | null };

export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase, profile } = await requireProfile('/admin');
  if (!profile.is_admin) notFound();
  const { q } = await searchParams;

  let members = supabase.from('profiles').select('id, handle, first_name, last_name, photo_url, country, status, created_at, job_title').order('created_at', { ascending: false }).limit(100);
  if (q?.trim()) {
    const like = `%${q.trim().replace(/[%_,()]/g, '')}%`;
    members = members.or(`first_name.ilike.${like},last_name.ilike.${like},handle.ilike.${like},company.ilike.${like}`);
  }
  const [m, r, mc, vc, rc] = await Promise.all([
    members,
    supabase.from('reports').select('id, reason, details, status, created_at, profile:profiles!reports_profile_id_fkey(id, handle, first_name, last_name, photo_url, country, status, created_at, job_title)').eq('status', 'open').order('created_at', { ascending: false }).limit(50),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('votes').select('id', { count: 'exact', head: true }),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open')
  ]);
  const list = (m.data || []) as Member[];
  const reports = (r.data || []) as unknown as Report[];

  return (
    <Shell profile={profile}>
      <div className="stack">
        <h1 style={{ fontSize: 24 }}>Admin</h1>
        <div className="stats card" style={{ gridTemplateColumns: 'repeat(3, 1fr)', borderTop: 0 }}>
          <div><b>{mc.count ?? 0}</b><span>Members</span></div>
          <div><b>{vc.count ?? 0}</b><span>Votes</span></div>
          <div><b>{rc.count ?? 0}</b><span>Open reports</span></div>
        </div>

        <section className="card">
          <div className="card-head"><h2>Reports to review</h2></div>
          {reports.length === 0 ? <p className="empty">No open reports.</p> : (
            <div className="scroll-x"><table className="tbl"><thead><tr><th>Member</th><th>Reason</th><th>Details</th><th>When</th><th /></tr></thead><tbody>
              {reports.map((x) => (
                <tr key={x.id}>
                  <td>{x.profile ? <Link href={`/v/${x.profile.handle}`} className="row" style={{ gap: 8, textDecoration: 'none' }}><Avatar p={x.profile} size={32} flag={false} />{x.profile.first_name} {x.profile.last_name}</Link> : 'Deleted'}</td>
                  <td>{x.reason}</td><td className="soft">{x.details || '–'}</td>
                  <td className="soft">{new Date(x.created_at).toLocaleDateString('en-GB')}</td>
                  <td><AdminReportActions reportId={x.id} memberId={x.profile?.id} memberStatus={x.profile?.status} /></td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Members</h2>
            <form action="/admin" className="row" style={{ gap: 6 }}>
              <input className="input" name="q" defaultValue={q} placeholder="Search" style={{ height: 34, width: 200 }} />
              <button className="btn btn-line btn-sm">Search</button>
            </form>
          </div>
          <div className="scroll-x"><table className="tbl"><thead><tr><th>Member</th><th>Country</th><th>Joined</th><th>Status</th><th /></tr></thead><tbody>
            {list.map((x) => (
              <tr key={x.id}>
                <td><Link href={`/v/${x.handle}`} className="row" style={{ gap: 8, textDecoration: 'none' }}><Avatar p={x} size={32} flag={false} /><span>{x.first_name} {x.last_name}<br /><span className="soft small">{x.job_title}</span></span></Link></td>
                <td>{countryName(x.country)}</td>
                <td className="soft">{new Date(x.created_at).toLocaleDateString('en-GB')}</td>
                <td><span className={`pill${x.status === 'active' ? '' : ' off'}`}>{x.status}</span></td>
                <td>{x.id !== profile.id ? <AdminMemberActions memberId={x.id} status={x.status} /> : null}</td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      </div>
    </Shell>
  );
}

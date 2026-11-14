import { requireProfile } from '@/lib/supabase/server';
import Shell from '@/components/Shell';
import ShareLink from '@/components/ShareLink';
import AskMembers from './AskMembers';
import { voteLink } from '@/lib/util';

export const metadata = { title: 'Get votes' };
export const dynamic = 'force-dynamic';

export default async function GetVotes() {
  const { supabase, profile } = await requireProfile('/get-votes');
  const [{ data: left }, { count: votes }] = await Promise.all([
    supabase.rpc('requests_left_today'),
    supabase.from('votes').select('id', { count: 'exact', head: true }).eq('candidate_id', profile.id)
  ]);
  const name = `${profile.first_name} ${profile.last_name}`;

  return (
    <Shell profile={profile}>
      <div className="grid-2">
        <div className="stack">
          <section className="card card-pad stack">
            <div>
              <p className="eyebrow">Your vote link</p>
              <h1 style={{ fontSize: 24, marginTop: 4 }}>Sell me this vote.</h1>
              <p className="muted" style={{ marginTop: 4 }}>Send this to the people who've seen you sell: clients, colleagues, your manager, friends and family. Anyone can vote for you once a year.</p>
            </div>
            <ShareLink url={voteLink(profile.handle)} name={name} />
          </section>

          <section className="card card-pad stack">
            <div className="row spread wrap-row">
              <div>
                <p className="eyebrow">Ask SPOTY members</p>
                <h2 style={{ marginTop: 4 }}>Request a vote</h2>
              </div>
              <span className="pill" style={{ background: 'var(--gold-tint)', color: 'var(--gold-ink)' }}>{Number(left ?? 3)} of 3 left today</span>
            </div>
            <p className="muted small">Ask up to 3 members a day. They get a notification from you. Swapping votes with other members is allowed.</p>
            <AskMembers myId={profile.id} initialLeft={Number(left ?? 3)} />
          </section>
        </div>

        <aside className="stack">
          <div className="card card-pad stack" style={{ gap: 6 }}>
            <p className="eyebrow">Your votes</p>
            <div className="big-number">{votes || 0}</div>
            <a href="/profile" className="soft small">See who voted for you</a>
          </div>
          <div className="card card-pad stack">
            <p className="eyebrow">For LinkedIn</p>
            <img src="/assets/share/spoty-post.png" alt="I'm going for Sales Person of the Year 2027" style={{ borderRadius: 8, width: '100%' }} />
            <div className="row wrap-row" style={{ gap: 8 }}>
              <a className="btn btn-line btn-sm" href="/assets/share/spoty-post.png" download>Post image</a>
              <a className="btn btn-line btn-sm" href="/assets/share/spoty-linkedin-banner.png" download>Banner</a>
            </div>
            <p className="soft small">Your personalised banner with your name and link is coming at launch.</p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

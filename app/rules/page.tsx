import { getSession } from '@/lib/supabase/server';
import Shell from '@/components/Shell';

export const metadata = { title: 'Rules' };

// Draft competition rules. To be reviewed by a solicitor before paid voting opens.
export default async function Rules() {
  const { profile } = await getSession();
  const S = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <section className="stack" style={{ gap: 6 }}><h2 style={{ fontSize: 18 }}>{t}</h2><div className="muted stack" style={{ gap: 8 }}>{children}</div></section>
  );
  return (
    <Shell profile={profile}>
      <article className="card card-pad narrow stack" style={{ margin: '0 auto', gap: 22 }}>
        <div>
          <p className="eyebrow">SPOTY 2027</p>
          <h1 style={{ fontSize: 28, marginTop: 4 }}>The rules</h1>
          <p className="soft small" style={{ marginTop: 4 }}>Draft, November 2026. We'll tell members about any changes.</p>
        </div>
        <S t="Who can take part"><p>Anyone aged 18 or over who works in sales, anywhere in the world. One profile per person, in your real name, with your real photo if you add one.</p></S>
        <S t="Voting">
          <p>Anyone can vote for each salesperson once per SPOTY year. That includes paid votes.</p>
          <p>Every member gets one free vote per year to give to another member. After that, a vote costs £0.99, or the local equivalent (US$0.99 in the USA and C$0.99 in Canada).</p>
          <p>You can't vote for yourself. Members can ask up to 3 other members for a vote each day, and can share their vote link with anyone. Members voting for each other is allowed.</p>
          <p>Voting closes at midnight (UK time) on 31 December 2027.</p>
        </S>
        <S t="The awards">
          <p><b>The Wolf:</b> most votes in the world. <b>Youngest in the World</b> and <b>Oldest in the World:</b> the youngest and oldest salesperson competing. These three win a trophy, a framed A4 certificate and the gold badge.</p>
          <p><b>President:</b> most votes in each country. <b>Prime Closer:</b> most votes for each age, worldwide. These win a digital certificate and the gold badge.</p>
          <p><b>Mover of the Month:</b> most votes that month, in every category. Digital certificate and a feature to all members.</p>
          <p>To compete for the age awards you must choose to show your age. Ages are checked before any award.</p>
        </S>
        <S t="One award per winner"><p>Each winner takes one award. If you qualify for more than one, you take the highest (The Wolf, then Youngest and Oldest in the World, then President, then Prime Closer) and the next person in line takes the other. Mover of the Month is separate.</p></S>
        <S t="Fair play">
          <p>Fake profiles, duplicate voters, bought or automated votes and impersonation are not allowed. We remove them, along with their votes, and can disqualify anyone involved.</p>
          <p>Winners must verify their identity and age before collecting an award. Your country locks once you have votes.</p>
        </S>
        <S t="Questions"><p>Email <a href="mailto:sales@spoty.club">sales@spoty.club</a>.</p></S>
      </article>
    </Shell>
  );
}

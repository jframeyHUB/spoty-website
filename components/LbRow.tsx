import Link from 'next/link';
import Avatar from './Avatar';

export type LbEntry = {
  rank: number; id: string; handle: string; first_name: string; last_name: string; photo_url: string | null; country: string;
  job_title: string | null; profession: string | null; age: number | null; votes: number; votes_this_month: number; is_me: boolean;
};

export default function LbRow({ e, metric = 'votes' }: { e: LbEntry; metric?: 'votes' | 'age' }) {
  const r = Number(e.rank);
  return (
    <Link href={`/v/${e.handle}`} className={`lb-row${e.is_me ? ' me' : ''}`}>
      {r <= 3 && metric === 'votes' ? <span className={`medal m${r}`} aria-label={`Rank ${r}`}>{r}</span> : <span className="rank">{r}</span>}
      <Avatar p={e} size={48} />
      <div style={{ minWidth: 0 }}>
        <div className="lb-name">{e.first_name} {e.last_name}{e.is_me ? <span className="soft"> · You</span> : null}</div>
        <div className="lb-sub">{[e.job_title, e.profession].filter(Boolean).join(' · ')}{e.age ? ` · ${e.age}` : ''}</div>
      </div>
      <div className="lb-votes">
        {metric === 'age'
          ? <><b>{e.age}</b><span>years old</span></>
          : <><b>{Number(e.votes).toLocaleString('en-GB')}</b><span>{Number(e.votes_this_month) ? `+${e.votes_this_month} this month` : 'votes'}</span></>}
      </div>
    </Link>
  );
}

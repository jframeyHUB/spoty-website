import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="auth-wrap">
      <div className="auth-card stack" style={{ textAlign: 'center' }}>
        <p className="eyebrow">404</p>
        <h1>We couldn't find that page</h1>
        <p className="muted">The link may be wrong, or the member may have left SPOTY.</p>
        <Link href="/leaderboard" className="btn btn-gold">See the leaderboard</Link>
      </div>
    </div>
  );
}

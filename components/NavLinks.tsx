'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

export default function NavLinks({ variant, handle, unread, isAdmin }: { variant: 'top' | 'bottom'; handle: string; unread: number; isAdmin: boolean }) {
  const path = usePathname() || '';
  const on = (p: string) => (path === p || path.startsWith(p + '/') ? 'on' : '');
  const profileOn = path === '/profile' || path.startsWith('/profile/') || path === `/v/${handle}` ? 'on' : '';

  if (variant === 'bottom') {
    return (
      <nav className="bottomnav" aria-label="Main">
        <Link href="/leaderboard" className={on('/leaderboard')}><span className="ic"><Icon name="trophy" size={22} /></span>Leaderboard</Link>
        <Link href="/get-votes" className={`mid ${on('/get-votes')}`}><span className="ic"><Icon name="vote" size={24} stroke={2.6} /></span>Get votes</Link>
        <Link href="/profile" className={profileOn}><span className="ic"><Icon name="user" size={22} /></span>Profile</Link>
      </nav>
    );
  }
  return (
    <nav className="topnav" aria-label="Main">
      <Link href="/leaderboard" className={on('/leaderboard')}><Icon name="trophy" size={18} />Leaderboard</Link>
      <Link href="/get-votes" className={on('/get-votes')}><Icon name="vote" size={18} />Get votes</Link>
      <Link href="/profile" className={profileOn}><Icon name="user" size={18} />Profile</Link>
      <Link href="/notifications" className={`bell ${on('/notifications')}`} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Icon name="bell" size={18} />{unread ? <span className="dot">{unread > 9 ? '9+' : unread}</span> : null}
      </Link>
      {isAdmin ? <Link href="/admin" className={on('/admin')}><Icon name="shield" size={18} />Admin</Link> : null}
    </nav>
  );
}

import { flagUrl, countryName } from '@/lib/countries';

type Person = { first_name: string; last_name: string; photo_url?: string | null; country?: string | null };

export default function Avatar({ p, size = 48, flag = true }: { p: Person; size?: number; flag?: boolean }) {
  const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
  return (
    <span className="av" style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {p.photo_url ? <img className="photo" src={p.photo_url} alt="" width={size} height={size} /> : initials}
      {flag && p.country ? <img className="flag" src={flagUrl(p.country)} alt={countryName(p.country)} title={countryName(p.country)} /> : null}
    </span>
  );
}

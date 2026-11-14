'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export function AdminMemberActions({ memberId, status }: { memberId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    const next = status === 'active' ? 'suspended' : 'active';
    if (next === 'suspended' && !confirm('Suspend this member? They disappear from the leaderboards until you restore them.')) return;
    setBusy(true);
    await supabaseBrowser().from('profiles').update({ status: next }).eq('id', memberId);
    setBusy(false);
    router.refresh();
  }
  return <button className={`btn btn-sm ${status === 'active' ? 'btn-danger' : 'btn-line'}`} disabled={busy} onClick={toggle}>{status === 'active' ? 'Suspend' : 'Restore'}</button>;
}

export function AdminReportActions({ reportId, memberId, memberStatus }: { reportId: number; memberId?: string; memberStatus?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function close(status: 'resolved' | 'dismissed', suspend = false) {
    setBusy(true);
    const supabase = supabaseBrowser();
    if (suspend && memberId) await supabase.from('profiles').update({ status: 'suspended' }).eq('id', memberId);
    await supabase.from('reports').update({ status }).eq('id', reportId);
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="row" style={{ gap: 6 }}>
      {memberStatus === 'active' ? <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => close('resolved', true)}>Suspend</button> : null}
      <button className="btn btn-line btn-sm" disabled={busy} onClick={() => close('dismissed')}>Dismiss</button>
    </div>
  );
}

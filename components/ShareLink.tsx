'use client';
import { useState } from 'react';
import Icon from './Icon';

// The member's vote link with copy, LinkedIn, WhatsApp and native share.
export default function ShareLink({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const text = `I'm going for Sales Person of the Year 2027. Sell me this vote: ${url}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: `Vote for ${name}`, text, url }); } catch { /* cancelled */ } } else copy();
  }
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="share-box">
        <code>{url.replace('https://www.', '')}</code>
        <button className="btn btn-navy btn-sm" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={16} />{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <div className="row wrap-row" style={{ gap: 8 }}>
        <a className="btn btn-gold btn-sm" target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}>Share on LinkedIn</a>
        <a className="btn btn-line btn-sm" target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>WhatsApp</a>
        <button className="btn btn-line btn-sm" onClick={share}><Icon name="share" size={16} />More</button>
      </div>
    </div>
  );
}

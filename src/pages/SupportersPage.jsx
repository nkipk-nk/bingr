import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SupportersPage({ onBack }) {
  const [supporters, setSupporters] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    supabase
      .from('bingr_donations')
      .select('username, amount_kes, donated_at, note')
      .eq('confirmed', true)
      .eq('show_on_wall', true)
      .order('donated_at', { ascending: false })
      .then(({ data }) => {
        setSupporters(data || [])
        setTotal((data || []).reduce((s, d) => s + d.amount_kes, 0))
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 24, fontFamily: 'inherit' }}>← Back</button>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>☕</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>bingr supporters</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          These amazing people have supported bingr with M-Pesa donations, keeping it free and ad-free for everyone.
          Every contribution goes directly to hosting, maintenance, and new features.
        </p>
        {total > 0 && (
          <div style={{ marginTop: 16, display: 'inline-block', padding: '8px 20px', background: 'rgba(232,57,42,0.08)', border: '1px solid rgba(232,57,42,0.2)', borderRadius: 20 }}>
            <span style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600 }}>KES {total.toLocaleString()} raised total 🎉</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      ) : supporters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 14, marginBottom: 16 }}>No supporters yet — be the first! 🙏</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {supporters.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(232,57,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>☕</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{s.username}</div>
                {s.note && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>"{s.note}"</div>}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(s.donated_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })}
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>KES {s.amount_kes}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 32, padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>Want to support bingr? Click the ☕ button anywhere in the app.</p>
        <button onClick={onBack} style={{ padding: '9px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Back to bingr</button>
      </div>
    </div>
  )
}

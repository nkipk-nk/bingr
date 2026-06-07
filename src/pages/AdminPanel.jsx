import { useState, useEffect } from 'react'

const TABS = ['Users', 'Feedback', 'Donations']
const STATUS_COLORS = { unread: '#e24b4a', read: '#ba7517', resolved: '#1d9e75' }
const CATEGORY_ICONS = { bug: '🐛', feature: '💡', content: '🎬', general: '💬', other: '🔧' }

export default function AdminPanel({ adminHook, onBack }) {
  const { loading, users, feedback, donations, loadAll, markFeedback, addDonation, updateDonation, deleteDonation, promoteUser } = adminHook
  const [tab, setTab] = useState('Users')
  const [showAddDonation, setShowAddDonation] = useState(false)
  const [donationForm, setDonationForm] = useState({ username: '', amount_kes: '', note: '', show_on_wall: false, confirmed: true })
  const [userSearch, setUserSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  const stats = {
    totalUsers: users.length,
    unreadFeedback: feedback.filter(f => f.status === 'unread').length,
    totalDonations: donations.filter(d => d.confirmed).reduce((s, d) => s + d.amount_kes, 0),
    donorCount: donations.filter(d => d.confirmed).length,
  }

  const filteredUsers = users.filter(u =>
    !userSearch || u.username?.includes(userSearch.toLowerCase()) || u.display_name?.includes(userSearch.toLowerCase())
  )

  const handleAddDonation = async () => {
    if (!donationForm.amount_kes) return
    setSaving(true)
    const { error } = await addDonation({
      username: donationForm.username || 'Anonymous',
      amount_kes: parseInt(donationForm.amount_kes),
      note: donationForm.note || null,
      show_on_wall: donationForm.show_on_wall,
      confirmed: donationForm.confirmed,
      donated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (!error) { setShowAddDonation(false); setDonationForm({ username: '', amount_kes: '', note: '', show_on_wall: false, confirmed: true }) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: 'var(--font)' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, fontFamily: 'inherit', padding: 0 }}>← Back to bingr</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>⚙️ Admin Panel</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', padding: '4px 10px', background: 'rgba(232,57,42,0.1)', borderRadius: 20, color: 'var(--accent)', fontWeight: 600 }}>ADMIN</div>
      </div>

      <div style={{ padding: '1.5rem' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total users', value: stats.totalUsers, icon: '👥' },
            { label: 'Unread feedback', value: stats.unreadFeedback, icon: '📬', alert: stats.unreadFeedback > 0 },
            { label: 'Total donated', value: `KES ${stats.totalDonations.toLocaleString()}`, icon: '☕' },
            { label: 'Supporters', value: stats.donorCount, icon: '🙏' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: `1px solid ${s.alert ? 'rgba(226,75,74,0.4)' : 'var(--border)'}`, borderRadius: 12, padding: '1rem' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.alert ? '#e24b4a' : 'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 18px', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, color: tab === t ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'inherit', fontWeight: tab === t ? 600 : 400 }}>
              {t}{t === 'Feedback' && stats.unreadFeedback > 0 ? ` (${stats.unreadFeedback})` : ''}
            </button>
          ))}
        </div>

        {/* ── USERS ── */}
        {tab === 'Users' && (
          <div>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
              placeholder="Search users…"
              style={{ width: '100%', maxWidth: 320, padding: '8px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }} />
            {loading ? <div style={Loading}>Loading…</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Username', 'Display name', 'Role', 'Country', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 500 }}>@{u.username}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.display_name || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: u.role === 'admin' ? 'rgba(232,57,42,0.1)' : 'var(--bg-input)', color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.country_code || '—'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-KE') : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            onClick={() => { if (window.confirm(`${u.role === 'admin' ? 'Remove admin from' : 'Make admin'}: @${u.username}?`)) promoteUser(u.id, u.role === 'admin' ? 'user' : 'admin') }}
                            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                            {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredUsers.length && <div style={Empty}>No users found</div>}
              </div>
            )}
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {tab === 'Feedback' && (
          <div>
            {loading ? <div style={Loading}>Loading…</div> : !feedback.length ? (
              <div style={Empty}>No feedback yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feedback.map(f => (
                  <div key={f.id} style={{ background: 'var(--bg-card)', border: `1px solid ${f.status === 'unread' ? 'rgba(226,75,74,0.3)' : 'var(--border)'}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[f.category] || '💬'}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{f.category}</span>
                        {f.username && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{f.username}</span>}
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${STATUS_COLORS[f.status]}20`, color: STATUS_COLORS[f.status], fontWeight: 600 }}>{f.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(f.created_at).toLocaleDateString('en-KE')}</span>
                        {['unread', 'read', 'resolved'].map(s => s !== f.status && (
                          <button key={s} onClick={() => markFeedback(f.id, s)}
                            style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Mark {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>{f.message}</p>
                    {f.email && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>📧 {f.email}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DONATIONS ── */}
        {tab === 'Donations' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => setShowAddDonation(true)}
                style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                + Record donation
              </button>
            </div>

            {showAddDonation && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Record M-Pesa donation</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={Lbl}>Username / name</label>
                    <input value={donationForm.username} onChange={e => setDonationForm(p => ({ ...p, username: e.target.value }))}
                      placeholder="e.g. john_doe or Anonymous" style={Inp} />
                  </div>
                  <div>
                    <label style={Lbl}>Amount (KES) *</label>
                    <input type="number" value={donationForm.amount_kes} onChange={e => setDonationForm(p => ({ ...p, amount_kes: e.target.value }))}
                      placeholder="e.g. 150" style={Inp} />
                  </div>
                  <div>
                    <label style={Lbl}>Note (optional)</label>
                    <input value={donationForm.note} onChange={e => setDonationForm(p => ({ ...p, note: e.target.value }))}
                      placeholder="e.g. via M-Pesa message" style={Inp} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                  {[['confirmed', '✓ Confirmed payment'], ['show_on_wall', '🌟 Show on supporter wall']].map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={donationForm[key]} onChange={e => setDonationForm(p => ({ ...p, [key]: e.target.checked }))}
                        style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                      {label}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowAddDonation(false)} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
                  <button onClick={handleAddDonation} disabled={!donationForm.amount_kes || saving}
                    style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {loading ? <div style={Loading}>Loading…</div> : !donations.length ? (
              <div style={Empty}>No donations recorded yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {donations.map(d => (
                  <div key={d.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 20 }}>☕</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{d.username || 'Anonymous'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(d.donated_at).toLocaleDateString('en-KE')} {d.note ? `· ${d.note}` : ''}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>KES {d.amount_kes.toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: d.confirmed ? 'rgba(29,158,117,0.1)' : 'rgba(186,117,23,0.1)', color: d.confirmed ? '#1d9e75' : '#ba7517', fontWeight: 600 }}>
                        {d.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                      {d.show_on_wall && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(232,57,42,0.1)', color: 'var(--accent)', fontWeight: 600 }}>On wall</span>}
                      <button onClick={() => updateDonation(d.id, { show_on_wall: !d.show_on_wall })}
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {d.show_on_wall ? 'Remove from wall' : 'Add to wall'}
                      </button>
                      <button onClick={() => { if (window.confirm('Delete this donation record?')) deleteDonation(d.id) }}
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(226,75,74,0.3)', background: 'none', color: '#e24b4a', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const Loading = { textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: 14 }
const Empty = { textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: 14 }
const Lbl = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }
const Inp = { width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

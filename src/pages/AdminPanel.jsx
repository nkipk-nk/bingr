import { useState, useEffect } from 'react'
import {
  ArrowLeft, Settings, Users, Mail, Coffee, HeartHandshake,
  Bug, Lightbulb, Clapperboard, MessageCircle, Wrench,
  CheckCircle2, AlertTriangle, Plus, Flag,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PageTabBar } from '../components/ui/Tab'
import styles from './AdminPanel.module.css'

const TABS = ['Users', 'Feedback', 'Donations', 'Comments']
const FEEDBACK_TONE = { unread: 'danger', read: 'warning', resolved: 'success' }
const CATEGORY_ICONS = { bug: Bug, feature: Lightbulb, content: Clapperboard, general: MessageCircle, other: Wrench }

export default function AdminPanel({ adminHook, onBack }) {
  const { loading, users, feedback, donations, comments, loadAll, markFeedback, addDonation, updateDonation, deleteDonation, promoteUser, hideComment, restoreComment, deleteCommentAdmin } = adminHook
  const [tab, setTab] = useState('Users')
  const [showAddDonation, setShowAddDonation] = useState(false)
  const [donationForm, setDonationForm] = useState({ username: '', amount_kes: '', note: '', show_on_wall: false, confirmed: true })
  const [userSearch, setUserSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null) // { kind: 'ok'|'err', msg }
  const [confirmAction, setConfirmAction] = useState(null) // { title, message, danger, run }

  const flash = (kind, msg) => { setNotice({ kind, msg }); setTimeout(() => setNotice(null), 4000) }

  const handlePromote = (u) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin'
    setConfirmAction({
      title: nextRole === 'admin' ? 'Make admin?' : 'Remove admin?',
      message: `${nextRole === 'admin' ? 'Make admin' : 'Remove admin from'}: @${u.username}?`,
      danger: false,
      run: async () => {
        const { error } = await promoteUser(u.id, nextRole)
        if (error) flash('err', error)
        else flash('ok', `@${u.username} is now ${nextRole}`)
      },
    })
  }

  useEffect(() => { loadAll() }, [])

  const stats = {
    totalUsers: users.length,
    unreadFeedback: feedback.filter(f => f.status === 'unread').length,
    totalDonations: donations.filter(d => d.confirmed).reduce((s, d) => s + d.amount_kes, 0),
    donorCount: donations.filter(d => d.confirmed).length,
  }

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true
    const needle = userSearch.toLowerCase()
    // display_name is free text and can contain any casing — username is
    // already lowercase-enforced at signup, but comparing it the same way
    // costs nothing and stays correct if that ever changes.
    return u.username?.toLowerCase().includes(needle) || u.display_name?.toLowerCase().includes(needle)
  })

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
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" size="sm" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Back to bingr
        </Button>
        <div className={styles.headerTitle}><Settings size={20} /> Admin Panel</div>
        <div className={styles.adminTag}>Admin</div>
      </div>

      <div className={styles.main}>
        {notice && (
          <div className={[styles.notice, notice.kind === 'ok' ? styles.noticeOk : styles.noticeErr].join(' ')}>
            {notice.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {notice.msg}
          </div>
        )}

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { label: 'Total users', value: stats.totalUsers, icon: Users },
            { label: 'Unread feedback', value: stats.unreadFeedback, icon: Mail, alert: stats.unreadFeedback > 0 },
            { label: 'Total donated', value: `KES ${stats.totalDonations.toLocaleString()}`, icon: Coffee },
            { label: 'Supporters', value: stats.donorCount, icon: HeartHandshake },
          ].map(s => (
            <Card key={s.label} className={[styles.statCard, s.alert ? styles.statCardAlert : ''].join(' ')}>
              <s.icon size={22} className={styles.statIcon} />
              <div className={[styles.statValue, s.alert ? styles.statValueAlert : ''].join(' ')}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.tabWrap}>
          <PageTabBar
            value={tab}
            onChange={setTab}
            items={TABS.map(t => ({ id: t, label: t === 'Feedback' && stats.unreadFeedback > 0 ? `${t} (${stats.unreadFeedback})` : t }))}
          />
        </div>

        {/* ── USERS ── */}
        {tab === 'Users' && (
          <div>
            <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users…" className={styles.searchInput} />
            {loading ? <div className={styles.emptyState}>Loading…</div> : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {['Username', 'Display name', 'Role', 'Country', 'Joined', 'Actions'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td className={styles.tableUserCell}>@{u.username}</td>
                        <td>{u.display_name || '—'}</td>
                        <td>{u.role === 'admin' ? <span className={styles.pillBrand}>admin</span> : <Badge tone="neutral">user</Badge>}</td>
                        <td>{u.country_code || '—'}</td>
                        <td className={styles.tableNowrap}>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-KE') : '—'}</td>
                        <td>
                          <Button variant="secondary" size="sm" onClick={() => handlePromote(u)}>
                            {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredUsers.length && <div className={styles.emptyState}>No users found</div>}
              </div>
            )}
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {tab === 'Feedback' && (
          <div>
            {loading ? <div className={styles.emptyState}>Loading…</div> : !feedback.length ? (
              <div className={styles.emptyState}>No feedback yet</div>
            ) : (
              <div className={styles.cardList}>
                {feedback.map(f => {
                  const CategoryIcon = CATEGORY_ICONS[f.category] || MessageCircle
                  return (
                    <Card key={f.id} className={[styles.itemCard, f.status === 'unread' ? styles.itemCardWarn : ''].join(' ')}>
                      <div className={styles.itemHeaderRow}>
                        <div className={styles.itemMetaGroup}>
                          <CategoryIcon size={16} color="var(--text-secondary)" />
                          <span className={styles.itemTitle}>{f.category}</span>
                          {f.username && <span className={styles.itemHandle}>@{f.username}</span>}
                          <Badge tone={FEEDBACK_TONE[f.status]}>{f.status}</Badge>
                        </div>
                        <div className={styles.itemActionsGroup}>
                          <span className={styles.itemTimestamp}>{new Date(f.created_at).toLocaleDateString('en-KE')}</span>
                          {['unread', 'read', 'resolved'].map(s => s !== f.status && (
                            <Button key={s} variant="secondary" size="sm" onClick={() => markFeedback(f.id, s)}>Mark {s}</Button>
                          ))}
                        </div>
                      </div>
                      <p className={styles.itemBody}>{f.message}</p>
                      {f.email && <div className={styles.itemFootnote}><Mail size={12} /> {f.email}</div>}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DONATIONS ── */}
        {tab === 'Donations' && (
          <div>
            <div className={styles.donationsToolbar}>
              <Button variant="primary" size="sm" onClick={() => setShowAddDonation(true)}>
                <Plus size={14} /> Record donation
              </Button>
            </div>

            {showAddDonation && (
              <Card className={styles.donationFormCard}>
                <div className={styles.donationFormTitle}>Record M-Pesa donation</div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label>Username / name</label>
                    <Input value={donationForm.username} onChange={e => setDonationForm(p => ({ ...p, username: e.target.value }))} placeholder="e.g. john_doe or Anonymous" />
                  </div>
                  <div className={styles.formField}>
                    <label>Amount (KES) *</label>
                    <Input type="number" value={donationForm.amount_kes} onChange={e => setDonationForm(p => ({ ...p, amount_kes: e.target.value }))} placeholder="e.g. 150" />
                  </div>
                  <div className={styles.formField}>
                    <label>Note (optional)</label>
                    <Input value={donationForm.note} onChange={e => setDonationForm(p => ({ ...p, note: e.target.value }))} placeholder="e.g. via M-Pesa message" />
                  </div>
                </div>
                <div className={styles.checkboxRow}>
                  {[['confirmed', 'Confirmed payment'], ['show_on_wall', 'Show on supporter wall']].map(([key, label]) => (
                    <label key={key} className={styles.checkboxLabel}>
                      <input type="checkbox" checked={donationForm[key]} onChange={e => setDonationForm(p => ({ ...p, [key]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
                <div className={styles.formActions}>
                  <Button variant="secondary" size="sm" onClick={() => setShowAddDonation(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleAddDonation} disabled={!donationForm.amount_kes} loading={saving}>Save</Button>
                </div>
              </Card>
            )}

            {loading ? <div className={styles.emptyState}>Loading…</div> : !donations.length ? (
              <div className={styles.emptyState}>No donations recorded yet</div>
            ) : (
              <div className={styles.cardList}>
                {donations.map(d => (
                  <Card key={d.id} className={styles.donationRow}>
                    <Coffee size={20} className={styles.donationIcon} />
                    <div className={styles.donationBody}>
                      <div className={styles.donationName}>{d.username || 'Anonymous'}</div>
                      <div className={styles.donationMeta}>{new Date(d.donated_at).toLocaleDateString('en-KE')} {d.note ? `· ${d.note}` : ''}</div>
                    </div>
                    <div className={styles.donationAmount}>KES {d.amount_kes.toLocaleString()}</div>
                    <div className={styles.donationBadges}>
                      <Badge tone={d.confirmed ? 'success' : 'warning'}>{d.confirmed ? 'Confirmed' : 'Pending'}</Badge>
                      {d.show_on_wall && <span className={styles.pillBrand}>On wall</span>}
                      <Button variant="secondary" size="sm" onClick={() => updateDonation(d.id, { show_on_wall: !d.show_on_wall })}>
                        {d.show_on_wall ? 'Remove from wall' : 'Add to wall'}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setConfirmAction({ title: 'Delete donation record?', message: 'This cannot be undone.', danger: true, run: () => deleteDonation(d.id) })}>Delete</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMMENTS ── */}
        {tab === 'Comments' && (
          <div>
            {loading ? <div className={styles.emptyState}>Loading…</div> : !comments.length ? (
              <div className={styles.emptyState}>No comments yet</div>
            ) : (
              <div className={styles.cardList}>
                {comments.map(c => {
                  const flagCount = c.bingr_comment_flags?.[0]?.count ?? 0
                  return (
                    <Card key={c.id} className={[styles.itemCard, c.status === 'hidden' ? styles.itemCardWarn : flagCount > 0 ? styles.itemCardCaution : ''].join(' ')}>
                      <div className={styles.itemHeaderRow}>
                        <div className={styles.itemMetaGroup}>
                          <span className={styles.itemHandlePrimary}>@{c.username}</span>
                          <span className={styles.itemTimestamp}>on title #{c.tmdb_id} ({c.media_type})</span>
                          <Badge tone={c.status === 'hidden' ? 'danger' : 'success'}>{c.status === 'hidden' ? 'Hidden' : 'Visible'}</Badge>
                          {flagCount > 0 && (
                            <Badge tone="warning"><Flag size={10} /> {flagCount} report{flagCount !== 1 ? 's' : ''}</Badge>
                          )}
                        </div>
                        <div className={styles.itemActionsGroup}>
                          <span className={styles.itemTimestamp}>{new Date(c.created_at).toLocaleDateString('en-KE')}</span>
                          {c.status === 'visible' ? (
                            <Button variant="secondary" size="sm" onClick={() => hideComment(c.id)}>Hide</Button>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => restoreComment(c.id)}>Restore</Button>
                          )}
                          <Button variant="danger" size="sm" onClick={() => setConfirmAction({ title: 'Permanently delete comment?', message: 'This cannot be undone.', danger: true, run: () => deleteCommentAdmin(c.id) })}>Delete</Button>
                        </div>
                      </div>
                      <p className={styles.itemBody}>{c.comment}</p>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { confirmAction.run(); setConfirmAction(null) }}
        title={confirmAction?.title}
        message={confirmAction?.message}
        danger={confirmAction?.danger ?? true}
      />
    </div>
  )
}

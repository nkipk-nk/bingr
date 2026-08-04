import { useState, useEffect } from 'react'
import { Layers, Plus, ArrowLeft, Pencil, Trash2, Globe, Lock, Download, Film, X } from 'lucide-react'
import { IMG } from '../lib/tmdb'
import { exportListTXT, exportListCSV } from '../lib/export'
import { useToast } from '../contexts/useToast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PosterTile from '../components/ui/PosterTile'
import EmptyState from '../components/ui/EmptyState'
import styles from './ListsPage.module.css'

function CreateListModal({ onClose, onCreate }) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setLoading(true)
    await onCreate(name.trim(), description.trim(), isPublic)
    setLoading(false)
    onClose()
    showToast(`List "${name.trim()}" created`, { tone: 'success' })
  }

  return (
    <Modal open onClose={onClose} title="New List" size="compact">
      <div className={styles.editField}>
        <Input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="e.g. Best heist movies, Date night picks…" maxLength={100} />
      </div>
      <div className={styles.editField}>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="What's this list about?" maxLength={500} rows={3}
          className={styles.textarea} />
      </div>
      <div className={styles.visToggle} onClick={() => setIsPublic(v => !v)}>
        <div className={[styles.visSwitch, isPublic ? styles.visSwitchOn : styles.visSwitchOff].join(' ')}>
          <div className={[styles.visKnob, isPublic ? styles.visKnobOn : styles.visKnobOff].join(' ')} />
        </div>
        <div>
          <div className={styles.visLabel}>{isPublic ? 'Public list' : 'Private list'}</div>
        </div>
      </div>
      <div className={styles.editActions}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={!name.trim()} loading={loading}>Create list</Button>
      </div>
    </Modal>
  )
}

function ListDetailView({ list, onBack, onDelete, onUpdate, getListItems, removeFromList, addToList, onOpenItem }) {
  const { showToast, clearToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const [editDesc, setEditDesc] = useState(list.description || '')
  const [editPublic, setEditPublic] = useState(list.is_public)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    getListItems(list.id).then(data => { setItems(data); setLoading(false) })
  }, [list.id])

  const shareUrl = `${window.location.origin}/list/${list.id}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // CX10 (BINGR_UI_AUDIT.md) — remove-from-list is cheaply reversible, so
  // it's instant with an Undo toast rather than a confirm-before-acting
  // prompt. Undo re-fetches from the server (getListItems) instead of
  // splicing the removed item back into local state, so it can't drift
  // from what addToList actually persisted.
  const handleRemove = async (item) => {
    await removeFromList(list.id, item.tmdb_id)
    setItems(prev => prev.filter(x => x.tmdb_id !== item.tmdb_id))
    showToast(`Removed "${item.title || item.name}" from list`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          clearToast()
          const ok = await addToList(list.id, {
            id: item.tmdb_id, media_type: item.media_type, title: item.title,
            poster_path: item.poster_path, release_date: item.release_date, vote_average: item.vote_average,
          })
          if (ok) setItems(await getListItems(list.id))
        },
      },
    })
  }

  const saveEdit = async () => {
    await onUpdate(list.id, { name: editName.trim(), description: editDesc.trim(), is_public: editPublic })
    setEditing(false)
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className={styles.backBtn} onClick={onBack}><ArrowLeft size={16} /> Back to Lists</Button>

      <Card roomy className={styles.detailCard}>
        {editing ? (
          <div>
            <div className={styles.editField}><Input value={editName} onChange={e => setEditName(e.target.value)} maxLength={100} /></div>
            <div className={styles.editField}><textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className={styles.textarea} rows={2} maxLength={500} /></div>
            <div className={styles.visToggle} onClick={() => setEditPublic(v => !v)}>
              <div className={[styles.visSwitch, editPublic ? styles.visSwitchOn : styles.visSwitchOff].join(' ')}>
                <div className={[styles.visKnob, editPublic ? styles.visKnobOn : styles.visKnobOff].join(' ')} />
              </div>
              <span className={styles.visLabel}>{editPublic ? 'Public' : 'Private'}</span>
            </div>
            <div className={styles.editActions}>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={saveEdit}>Save</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className={styles.detailHeader}>
              <div className={styles.detailTitle}>{list.name}</div>
              <div className={styles.detailActions}>
                <Button variant="icon" onClick={() => setEditing(true)} title="Edit"><Pencil size={16} /></Button>
                <Button variant="icon" onClick={() => setConfirmDelete(true)} title="Delete"><Trash2 size={16} /></Button>
              </div>
            </div>
            <div className={styles.detailMeta}>
              {list.is_public ? <Globe size={12} className={styles.inlineIcon} /> : <Lock size={12} className={styles.inlineIcon} />} {list.is_public ? 'Public' : 'Private'} · {items.length} title{items.length !== 1 ? 's' : ''}
            </div>
            {list.description && <p className={styles.detailDesc}>{list.description}</p>}

            {list.is_public && (
              <div className={styles.shareRow}>
                <span className={styles.shareUrl}>{shareUrl}</span>
                <Button variant="secondary" size="sm" onClick={handleCopyLink}>{copied ? '✓ Copied' : 'Copy link'}</Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {items.length > 0 && (
        <Card className={styles.detailCard}>
          <div className={styles.exportRow}>
            <span className={styles.exportLabel}><Download size={14} /> Export this list</span>
            <div className={styles.exportBtns}>
              <Button variant="secondary" size="sm" onClick={() => { exportListTXT(list.name, items); showToast('List exported as TXT', { tone: 'success' }) }}>TXT</Button>
              <Button variant="secondary" size="sm" onClick={() => { exportListCSV(list.name, items); showToast('List exported as CSV', { tone: 'success' }) }}>CSV</Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className={styles.centeredMsg}>Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Film} title="This list is empty" description={'Open any movie or TV show and click "Add to list"'} />
      ) : (
        <div className={styles.itemsGrid}>
          {items.map(item => (
            <div key={item.tmdb_id} className={styles.itemCard}>
              <div onClick={() => onOpenItem({ ...item, id: item.tmdb_id })}>
                <PosterTile size="md" src={item.poster_path ? IMG(item.poster_path) : null} alt={item.title || item.name} />
                <div className={styles.itemTitle}>{item.title || item.name}</div>
                <div className={styles.itemMeta}>{(item.release_date || '').slice(0, 4)} · {item.media_type === 'tv' ? 'TV' : 'Film'}</div>
              </div>
              <button className={styles.itemRemove} title="Remove from list" onClick={() => handleRemove(item)}><X size={11} /></button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { onDelete(list.id); setConfirmDelete(false) }}
        title="Delete this list?"
        message={`Delete "${list.name}"? This cannot be undone.`}
      />
    </div>
  )
}

export default function ListsPage({ listsHook, onOpenItem }) {
  const { lists, createList, updateList, deleteList, addToList, removeFromList, getListItems } = listsHook
  const [showCreate, setShowCreate] = useState(false)
  const [activeList, setActiveList] = useState(null)

  const handleDelete = async (listId) => {
    await deleteList(listId)
    setActiveList(null)
  }

  if (activeList) {
    const list = lists.find(l => l.id === activeList) || activeList
    return (
      <ListDetailView
        list={list}
        onBack={() => setActiveList(null)}
        onDelete={handleDelete}
        onUpdate={updateList}
        getListItems={getListItems}
        removeFromList={removeFromList}
        addToList={addToList}
        onOpenItem={onOpenItem}
      />
    )
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.headerTitle}><Layers size={20} className={styles.headerIcon} />My Lists</div>
          <div className={styles.headerSub}>Curate and share your favourite titles</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> New List</Button>
      </div>

      {lists.length === 0 ? (
        <EmptyState icon={Layers} title="No lists yet" description="Create a list to curate and share your favourite titles" actionLabel="Create your first list" onAction={() => setShowCreate(true)} />
      ) : (
        <div className={styles.grid}>
          {lists.map(list => {
            const count = list.bingr_list_items?.[0]?.count ?? 0
            return (
              <Card key={list.id} className={styles.card} onClick={() => setActiveList(list.id)}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>{list.name}</div>
                  {list.is_public ? <Globe size={14} className={styles.cardVisIcon} /> : <Lock size={14} className={styles.cardVisIcon} />}
                </div>
                {list.description && <div className={styles.cardDesc}>{list.description}</div>}
                <div className={styles.cardCount}>{count} title{count !== 1 ? 's' : ''}</div>
              </Card>
            )
          })}
        </div>
      )}

      {showCreate && <CreateListModal onClose={() => setShowCreate(false)} onCreate={createList} />}
    </div>
  )
}

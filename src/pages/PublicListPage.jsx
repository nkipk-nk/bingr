import { useState, useEffect } from 'react'
import { Search, Globe, ArrowLeft, Film } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { IMG } from '../lib/tmdb'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import PosterTile from '../components/ui/PosterTile'
import EmptyState from '../components/ui/EmptyState'
import styles from './PublicListPage.module.css'

export default function PublicListPage({ listId, onSignUp, onGoHome }) {
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!listId) { setNotFound(true); setLoading(false); return }
    Promise.all([
      supabase.from('bingr_lists').select('*').eq('id', listId).eq('is_public', true).single(),
      supabase.from('bingr_list_items').select('*').eq('list_id', listId).order('added_at', { ascending: false })
    ]).then(([{ data: listData }, { data: itemData }]) => {
      if (!listData) { setNotFound(true); setLoading(false); return }
      setList(listData)
      setItems(itemData || [])
      setLoading(false)
    }).catch(() => { setNotFound(true); setLoading(false) })
  }, [listId])

  if (loading) return (
    <div className={styles.centered}><div className={styles.centeredText}>Loading list…</div></div>
  )

  if (notFound) return (
    <div className={styles.centered}>
      <div className={styles.notFoundWrap}>
        <Search size={40} className={styles.notFoundIcon} />
        <div className={styles.notFoundTitle}>List not found</div>
        <div className={styles.notFoundDesc}>This list is private or doesn't exist.</div>
        <Button variant="primary" onClick={onGoHome}>Go to bingr</Button>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" size="sm" className={styles.backBtn} onClick={onGoHome}><ArrowLeft size={16} /> Back</Button>
          <button className={styles.brand} onClick={onGoHome}>
            <img src="/logo.png" alt="bingr" className={styles.brandLogo} />
            <span className={styles.brandName}>bingr</span>
          </button>
        </div>
        <Button variant="primary" size="sm" onClick={onSignUp}>Sign up free</Button>
      </header>

      <div className={styles.body}>
        <Card className={styles.listHeader}>
          <div className={styles.listHeaderTop}>
            <div className={styles.listTitle}>{list.name}</div>
            <Badge tone="neutral"><Globe size={11} className={styles.badgeIcon} /> Public list</Badge>
          </div>
          {list.description && <p className={styles.listDesc}>{list.description}</p>}
          <div className={styles.listCount}>{items.length} title{items.length !== 1 ? 's' : ''}</div>
        </Card>

        {items.length === 0 ? (
          <EmptyState icon={Film} title="This list is empty" />
        ) : (
          <div className={styles.itemsGrid}>
            {items.map(item => (
              <div key={item.tmdb_id}>
                <PosterTile size="md" src={item.poster_path ? IMG(item.poster_path) : null} alt={item.title || item.name} />
                <div className={styles.itemTitle}>{item.title || item.name}</div>
                <div className={styles.itemMeta}>{(item.release_date || '').slice(0, 4)} · {item.media_type === 'tv' ? 'TV' : 'Film'}</div>
              </div>
            ))}
          </div>
        )}

        <Card roomy className={styles.ctaCard}>
          <img src="/logo.png" alt="bingr" className={styles.ctaLogo} />
          <div className={styles.ctaTitle}>Track your own watch life</div>
          <p className={styles.ctaDesc}>bingr is free. Rate movies, track episodes, create your own lists and share them.</p>
          <Button variant="primary" onClick={onSignUp}>Sign up free →</Button>
        </Card>
      </div>
    </div>
  )
}

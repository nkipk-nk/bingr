import { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import Avatar from './ui/Avatar'
import styles from './FollowerListSheet.module.css'

// GP1 (BINGR_UI_AUDIT.md) — follower/following counts used to be static
// text with no way to see, browse, or unfollow from the actual list.
export default function FollowerListSheet({ open, onClose, userId, type, getUsers, onOpenProfile }) {
  const [users, setUsers] = useState(null)

  useEffect(() => {
    if (!open) { setUsers(null); return }
    getUsers(userId, type).then(setUsers)
  }, [open, userId, type, getUsers])

  return (
    <Modal open={open} onClose={onClose} title={type === 'followers' ? 'Followers' : 'Following'} size="full">
      {users === null ? (
        <div className={styles.centeredMsg}>Loading…</div>
      ) : users.length === 0 ? (
        <div className={styles.centeredMsg}>{type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}</div>
      ) : (
        users.map(u => (
          <div key={u.id} className={styles.row} onClick={() => { onClose(); onOpenProfile(u.username) }}>
            <Avatar size="md" name={u.display_name || u.username} />
            <div className={styles.body}>
              <div className={styles.name}>{u.display_name || u.username}</div>
              <div className={styles.handle}>@{u.username}</div>
            </div>
          </div>
        ))
      )}
    </Modal>
  )
}

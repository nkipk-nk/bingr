import { Users } from 'lucide-react'
import ActivityFeed from './ActivityFeed'
import FindPeople from '../components/FindPeople'
import styles from './FeedPage.module.css'

export default function FeedPage({ feedHook, following, session, followsHook, onOpenItem, onOpenProfile }) {
  return (
    <div>
      <ActivityFeed
        feedHook={feedHook}
        following={following}
        onOpenItem={onOpenItem}
        onOpenProfile={onOpenProfile}
        onDiscover={() => document.getElementById('find-people')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />
      <div id="find-people" className={styles.findPeople}>
        <div className={styles.findPeopleTitle}><Users size={18} /> Find people to follow</div>
        <div className={styles.findPeopleSub}>Search by username or browse recently active users</div>
        <FindPeople session={session} followsHook={followsHook} onOpenProfile={onOpenProfile} />
      </div>
    </div>
  )
}

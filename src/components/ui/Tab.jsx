import { useEffect, useRef, useState } from 'react'
import styles from './Tab.module.css'

// §8 Tab spec, two contexts: NavTabBar (bottom bar, icon + body-xs label,
// 2px top indicator) and PageTabBar (in-page sections, text label + an
// animated underline sliding between positions).

export function NavTabBar({ items, value, onChange, className = '' }) {
  return (
    <nav className={[styles.navBar, className].filter(Boolean).join(' ')}>
      {items.map(item => {
        const Icon = item.icon
        const active = item.id === value
        return (
          <button
            key={item.id}
            className={[styles.navItem, active ? styles.navItemActive : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(item.id)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function PageTabBar({ items, value, onChange, className = '' }) {
  const refs = useRef({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const el = refs.current[value]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value, items])

  return (
    <div className={[styles.pageBar, className].filter(Boolean).join(' ')}>
      {items.map(item => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            ref={el => { refs.current[item.id] = el }}
            className={[styles.pageItem, active ? styles.pageItemActive : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(item.id)}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </button>
        )
      })}
      <span className={styles.pageIndicator} style={{ left: indicator.left, width: indicator.width }} />
    </div>
  )
}

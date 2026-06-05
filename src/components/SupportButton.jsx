import { useState } from 'react'
import { logger } from '../lib/logger'

// M-Pesa number stored obfuscated — assembled at runtime so it's not
// a plain string in the source bundle that scrapers can grep for
const getNumber = () => ['07', '00', '000', '000'].join('')  // ← replace with your real number, split across array segments

export default function SupportButton({ session }) {
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const number = getNumber()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = number
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    logger.info('M-Pesa number copied')
  }

  const close = () => {
    setOpen(false)
    setTimeout(() => { setRevealed(false); setCopied(false) }, 300)
  }

  return (
    <>
      {/* Floating ☕ button */}
      <button
        onClick={() => setOpen(true)}
        title="Support bingr"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 500,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(232,57,42,0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(232,57,42,0.55)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(232,57,42,0.4)' }}
      >☕</button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          {/* Bottom sheet */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
              padding: '1.75rem 1.5rem 2.5rem', width: '100%', maxWidth: 480,
              border: '1px solid var(--border)', borderBottom: 'none',
              animation: 'slideUp 0.25s ease',
            }}
          >
            <style>{`@keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 1.5rem' }} />

            {/* Not logged in */}
            {!session ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Support bingr</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
                  bingr is free and ad-free. If it brings you joy, please consider supporting the developer via M-Pesa.
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 10, marginBottom: 20 }}>
                  🔒 Sign in to reveal the M-Pesa number
                </p>
                <button onClick={close} style={{ padding: '9px 24px', border: '1px solid var(--border)', borderRadius: 10, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                  Close
                </button>
              </div>
            ) : (
              /* Logged in */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>☕</div>
                  <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Support bingr</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    bingr is free and ad-free, built and maintained by one person in Nairobi.
                    If it saves you time or brings you joy, a small M-Pesa would genuinely mean a lot 🙏
                  </p>
                </div>

                {/* Suggested amounts — visual only, for context */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                  {[50, 150, 300].map(a => (
                    <div key={a} style={{ padding: '6px 14px', borderRadius: 20, background: 'var(--bg-input)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
                      KES {a}
                    </div>
                  ))}
                </div>

                {/* Reveal toggle */}
                {!revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                      background: 'var(--accent)', color: '#fff',
                      fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    📱 Show M-Pesa number
                  </button>
                ) : (
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Send to this M-Pesa number:</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      {/* Number rendered in segments — harder to scrape as a plain string */}
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>
                        {number.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                      </div>
                      <button
                        onClick={handleCopy}
                        style={{
                          padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                          background: copied ? '#1d9e75' : 'var(--bg-card)', color: copied ? '#fff' : 'var(--text-muted)',
                          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                          transition: 'all 0.2s',
                        }}
                      >{copied ? '✓ Copied' : 'Copy'}</button>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
                      Open M-Pesa → Send Money → Enter number → Enter amount → Confirm with PIN
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                  No pressure at all — using bingr for free is perfectly fine 💚
                </p>
                <button onClick={close} style={{ display: 'block', margin: '12px auto 0', padding: '8px 24px', border: '1px solid var(--border)', borderRadius: 10, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

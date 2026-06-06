export default function LandingPage({ onSignUp, onSignIn }) {
  const features = [
    { icon: '🎬', title: 'Track everything', desc: 'Movies, TV shows, individual episodes — all in one place. Never lose track of where you left off.' },
    { icon: '⭐', title: 'Rate & rank', desc: 'Rate on a 10-point scale and build your personal rankings. Know exactly what was worth your time.' },
    { icon: '📺', title: 'Episode tracking', desc: 'Mark episodes watched one by one. See your progress per season and know exactly what\'s up next.' },
    { icon: '🔍', title: 'Discover what\'s next', desc: 'Browse trending titles and get smart recommendations based on what you\'ve already watched.' },
    { icon: '📋', title: 'Create lists', desc: 'Curate your own lists — "Best heist films", "Date night picks" — and share them with anyone.' },
    { icon: '🎥', title: 'Find where to watch', desc: 'See exactly which streaming services have what you want. No more jumping between apps.' },
  ]

  const stats = [
    { num: '500K+', label: 'Titles in database' },
    { num: '10', label: 'Point rating scale' },
    { num: '100%', label: 'Free, no ads' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: 'var(--font)' }}>

      {/* Nav */}
      <nav style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', letterSpacing: -0.5 }}>🎬 bingr</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSignIn} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Sign in</button>
          <button onClick={onSignUp} style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Sign up free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '5rem 2rem 4rem', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '5px 14px', background: 'rgba(232,57,42,0.1)', border: '1px solid rgba(232,57,42,0.2)', borderRadius: 20, fontSize: 13, color: 'var(--accent)', fontWeight: 500, marginBottom: 24 }}>
          Free · No ads · No fluff
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.15, marginBottom: 20, letterSpacing: -1 }}>
          Track your watch life.<br />
          <span style={{ color: 'var(--accent)' }}>Never miss a moment.</span>
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 36, maxWidth: 540, margin: '0 auto 36px' }}>
          bingr is your personal tracking app for movies and TV shows. Rate what you've seen, track every episode, discover what to watch next, and share curated lists with friends.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onSignUp} style={{ padding: '14px 32px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(232,57,42,0.35)' }}>
            Start tracking free →
          </button>
          <button onClick={onSignIn} style={{ padding: '14px 28px', background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign in
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14 }}>No credit card needed · Takes 30 seconds</p>
      </section>

      {/* Stats bar */}
      <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap' }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{s.num}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 8 }}>Everything you need</h2>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 40 }}>Built for people who take their watching seriously</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '3rem 2rem 4rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 36 }}>Get started in seconds</h2>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { step: '1', title: 'Create a free account', desc: 'Sign up with your email. No payment info needed.' },
              { step: '2', title: 'Search any title', desc: 'Find any movie or TV show from our 500K+ database.' },
              { step: '3', title: 'Track & rate', desc: 'Mark it watched, rate it, track episodes. Build your library.' },
            ].map(s => (
              <div key={s.step} style={{ flex: '1 1 180px', maxWidth: 200 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{s.step}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Ready to start tracking?</h2>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 28 }}>Join bingr for free. No ads, no nonsense.</p>
        <button onClick={onSignUp} style={{ padding: '14px 36px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(232,57,42,0.35)' }}>
          Create free account →
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem 2rem', display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>🎬 bingr</span>
        {['Privacy Policy', 'Terms of Service'].map(label => (
          <span key={label} style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>{label}</span>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>© {new Date().getFullYear()} bingr · Made in Nairobi 🇰🇪</span>
      </footer>
    </div>
  )
}

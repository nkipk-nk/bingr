export default function PrivacyPolicy({ onBack }) {
  const EFFECTIVE = 'June 2026'
  const CONTACT = 'privacy@bingr.app'

  const s = (title) => (
    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '2rem 0 0.75rem' }}>{title}</h2>
  )
  const p = (text) => (
    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 12 }}>{text}</p>
  )
  const li = (text) => (
    <li style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 6 }}>{text}</li>
  )

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, fontFamily: 'inherit', padding: 0 }}>← Back</button>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Effective date: {EFFECTIVE} · Last updated: {EFFECTIVE}</p>

      {p('bingr ("we", "us", "our") is operated from Kenya and is committed to protecting your personal data in accordance with the Kenya Data Protection Act 2019 and internationally recognised privacy best practices including GDPR principles. This policy explains what data we collect, why, how we store it, and your rights.')}

      {s('1. Data We Collect')}
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        {li('Email address — used to create and identify your account.')}
        {li('Password — stored as a one-way hash by Supabase Auth. We never see your plain-text password.')}
        {li('Watchlist, ratings, and episode progress — the content you choose to track in bingr.')}
        {li('Session tokens — short-lived tokens used to keep you signed in, stored in your browser.')}
        {li('Basic usage logs — errors and anonymised technical events for debugging. No browsing history, no ad tracking.')}
      </ul>
      {p('We do not collect your name, phone number, physical address, payment information, or any biometric data. We do not use third-party analytics or advertising trackers.')}

      {s('2. How We Use Your Data')}
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        {li('To provide the bingr service: saving your watchlist, ratings, and episode tracking.')}
        {li('To authenticate you securely and maintain your session.')}
        {li('To diagnose errors and improve the service (anonymised error logs).')}
        {li('To respond to support requests you initiate.')}
      </ul>
      {p('We do not sell, rent, or share your personal data with third parties for marketing purposes. Ever.')}

      {s('3. Data Storage and Third Parties')}
      {p('Your data is stored on Supabase (PostgreSQL database), hosted on AWS infrastructure. Supabase is GDPR-compliant and processes data under standard contractual clauses. Movie and TV show metadata is fetched from The Movie Database (TMDB) API — we do not send any personal data to TMDB.')}
      {p('Error logs may be processed by Sentry (sentry.io), a security-focused error tracking platform. Sentry processes anonymised technical data only — no watchlist contents or personal details are included in error reports.')}

      {s('4. Data Retention')}
      {p('Your account data is retained for as long as your account exists. If you delete your account, all personal data — including your email, watchlist, ratings, and episode history — is permanently and irreversibly deleted within 30 days. Error logs are retained for 90 days.')}

      {s('5. Your Rights')}
      {p('Under the Kenya Data Protection Act 2019 and applicable international law, you have the right to:')}
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        {li('Access — request a copy of the personal data we hold about you.')}
        {li('Rectification — correct inaccurate data.')}
        {li('Erasure ("right to be forgotten") — permanently delete your account and all associated data. You can do this yourself at any time via Account Settings → Delete Account, or by contacting us.')}
        {li('Restriction — ask us to stop processing your data in certain circumstances.')}
        {li('Portability — receive your data in a structured, machine-readable format.')}
        {li('Objection — object to processing based on legitimate interests.')}
      </ul>
      {p(`To exercise any of these rights, contact us at ${CONTACT}. We will respond within 30 days.`)}

      {s('6. Security')}
      {p('We implement industry-standard security measures including: encrypted data transmission (TLS), hashed password storage, Row Level Security (RLS) on all database tables ensuring users can only access their own data, PKCE authentication flow, and security response headers (HSTS, CSP, X-Frame-Options). No security measure is 100% foolproof — if you believe your account has been compromised, change your password immediately and contact us.')}

      {s('7. Cookies and Local Storage')}
      {p('bingr uses browser localStorage to store your session token so you stay signed in. We do not use advertising cookies, tracking pixels, or third-party cookies of any kind.')}

      {s('8. Children')}
      {p('bingr is not directed at children under the age of 16. We do not knowingly collect data from anyone under 16. If you believe a child has created an account, contact us and we will delete it promptly.')}

      {s('9. Changes to This Policy')}
      {p('We may update this policy from time to time. We will notify registered users of material changes via email. Continued use of bingr after changes constitutes acceptance of the updated policy.')}

      {s('10. Contact')}
      {p(`For privacy questions, data requests, or complaints, contact: ${CONTACT}`)}
      {p('If you are in the EU and believe we have violated GDPR, you also have the right to lodge a complaint with your local data protection authority.')}
    </div>
  )
}

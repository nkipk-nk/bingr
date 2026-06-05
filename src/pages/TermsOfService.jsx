export default function TermsOfService({ onBack }) {
  const EFFECTIVE = 'June 2026'
  const CONTACT = 'legal@bingr.app'

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

      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Effective date: {EFFECTIVE}</p>

      {p('These Terms of Service ("Terms") govern your use of bingr ("the Service"), operated from Kenya. By creating an account or using bingr, you agree to these Terms. If you do not agree, do not use the Service.')}

      {s('1. Eligibility')}
      {p('You must be at least 16 years old to use bingr. By using the Service, you confirm you meet this requirement. If you are under 18, you confirm you have parental or guardian consent.')}

      {s('2. Your Account')}
      {p('You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account. Notify us immediately at ' + CONTACT + ' if you suspect unauthorised access. We reserve the right to suspend or terminate accounts that violate these Terms.')}

      {s('3. Acceptable Use')}
      {p('You agree not to:')}
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        {li('Use bingr for any unlawful purpose or in violation of any applicable laws.')}
        {li('Attempt to gain unauthorised access to other users\' accounts or data.')}
        {li('Reverse-engineer, decompile, or extract source code from the Service.')}
        {li('Use automated scripts or bots to access the Service in a way that places unreasonable load on our infrastructure.')}
        {li('Attempt to circumvent security measures or rate limits.')}
        {li('Impersonate any person or entity.')}
      </ul>

      {s('4. Intellectual Property')}
      {p('bingr and its original content, features, and functionality are owned by bingr and are protected under applicable intellectual property laws. Movie and TV show data, images, and metadata are sourced from The Movie Database (TMDB) under their API terms of use. Streaming provider information is provided by TMDB and respective streaming platforms. bingr does not host or distribute any copyrighted media content.')}

      {s('5. Service Availability')}
      {p('We aim to keep bingr available at all times but do not guarantee uninterrupted access. The Service may be unavailable due to maintenance, outages, or factors outside our control. We are not liable for any loss resulting from Service downtime.')}

      {s('6. Disclaimer of Warranties')}
      {p('bingr is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be error-free, secure, or continuously available.')}

      {s('7. Limitation of Liability')}
      {p('To the fullest extent permitted by applicable law, bingr and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service, including loss of data. Our total liability to you shall not exceed the amount you have paid us in the 12 months preceding the claim (which, as bingr is currently free, is zero).')}

      {s('8. Termination')}
      {p('You may stop using bingr and delete your account at any time. We may suspend or terminate your access if you violate these Terms, with or without notice. Upon termination, your data will be deleted as described in our Privacy Policy.')}

      {s('9. Changes to Terms')}
      {p('We may update these Terms. We will notify you of material changes via email or an in-app notice. Continued use of bingr after changes constitutes acceptance. If you disagree with updated Terms, you may delete your account.')}

      {s('10. Governing Law')}
      {p('These Terms are governed by the laws of Kenya. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kenya. Nothing in these Terms affects your statutory rights under applicable consumer protection law in your jurisdiction.')}

      {s('11. Contact')}
      {p(`For questions about these Terms: ${CONTACT}`)}
    </div>
  )
}

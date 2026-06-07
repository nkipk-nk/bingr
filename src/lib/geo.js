/**
 * IP geolocation — called once on first login, stored in profile.country_code
 * Multiple fallbacks in case one provider is blocked or slow.
 */

async function tryFetch(url, parser, timeoutMs = 3000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    const data = await res.json()
    return parser(data)
  } catch {
    return null
  }
}

export async function detectCountryCode() {
  const providers = [
    () => tryFetch('https://ipapi.co/json/', d => d?.country_code),
    () => tryFetch('https://ipwho.is/', d => d?.country_code),
    () => tryFetch('https://ip-api.com/json/?fields=countryCode', d => d?.countryCode),
  ]
  for (const provider of providers) {
    const code = await provider()
    if (code && code.length === 2) return code
  }
  return null
}

export function isKenya(code) {
  return code === 'KE'
}

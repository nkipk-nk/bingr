/**
 * Lightweight IP geolocation
 * Uses ipapi.co free tier — no API key needed, 1000 req/day
 * Returns country code e.g. 'KE', 'US', 'GB'
 */

let cachedCountry = null

export async function getCountryCode() {
  if (cachedCountry) return cachedCountry
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
    const data = await res.json()
    cachedCountry = data.country_code || null
    return cachedCountry
  } catch {
    return null
  }
}

export function isKenya(code) {
  return code === 'KE'
}

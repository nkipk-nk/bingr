/**
 * Lightweight client-side moderation for comments.
 * This is a first line of defense — admin panel handles deeper moderation.
 */

// Minimal blocklist — extend as needed. Kept short and non-exhaustive on purpose;
// real moderation happens via admin review + user flagging.
const BLOCKED_PATTERNS = [
  /\b(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|c+u+n+t+|n+i+g+g+(?:a+|e+r+))\b/i,
]

const URL_PATTERN = /(https?:\/\/|www\.)\S+/gi
const REPEATED_CHAR_PATTERN = /(.)\1{6,}/ // same char 7+ times in a row (spam pattern)

export function moderateComment(text) {
  const trimmed = text.trim()

  if (!trimmed) return { ok: false, reason: 'Comment cannot be empty.' }
  if (trimmed.length < 2) return { ok: false, reason: 'Comment is too short.' }
  if (trimmed.length > 1000) return { ok: false, reason: 'Comment is too long (max 1000 characters).' }

  if (REPEATED_CHAR_PATTERN.test(trimmed)) {
    return { ok: false, reason: 'Please avoid repeated characters or spam patterns.' }
  }

  const urlMatches = trimmed.match(URL_PATTERN)
  if (urlMatches && urlMatches.length > 1) {
    return { ok: false, reason: 'Please limit links in your comment.' }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: 'Your comment contains language that violates our community guidelines.' }
    }
  }

  return { ok: true, text: trimmed }
}

// Simple in-memory rate limiter — resets on page reload, paired with
// server-side checks being added later via admin review
const commentTimestamps = []
const MAX_COMMENTS_PER_WINDOW = 5
const WINDOW_MS = 60 * 1000 // 1 minute

export function checkCommentRateLimit() {
  const now = Date.now()
  while (commentTimestamps.length && now - commentTimestamps[0] > WINDOW_MS) {
    commentTimestamps.shift()
  }
  if (commentTimestamps.length >= MAX_COMMENTS_PER_WINDOW) {
    return { ok: false, reason: 'You are commenting too quickly. Please wait a moment.' }
  }
  commentTimestamps.push(now)
  return { ok: true }
}

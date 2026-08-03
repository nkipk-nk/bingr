import { describe, it, expect } from 'vitest'
import { computeStats, formatHours } from './stats'

// Regression tests for m12 — computeStats used to multiply a flat average by
// a count for every watched movie/episode. It now sums each item's real
// runtime_minutes when present, falling back to the average per-item for
// anything that doesn't have one (older rows, or ones added from a context
// without full TMDB details loaded).
describe('computeStats — runtime handling', () => {
  it('falls back to the flat average when no item has a real runtime', () => {
    const library = {
      1: { media_type: 'movie', status: 'watched', rating: 0 },
      2: { media_type: 'movie', status: 'watched', rating: 0 },
    }
    const stats = computeStats([], library, {})
    // 2 movies * 110min average = 220min = ~4 hours (rounds to nearest hour)
    expect(stats.totalHours).toBe(Math.round(220 / 60))
  })

  it('uses real runtime_minutes when present instead of the average', () => {
    const library = {
      1: { media_type: 'movie', status: 'watched', rating: 0, runtime_minutes: 200 },
    }
    const stats = computeStats([], library, {})
    expect(stats.totalHours).toBe(Math.round(200 / 60))
  })

  it('mixes real and estimated runtime item-by-item, not as an all-or-nothing choice', () => {
    const library = {
      1: { media_type: 'movie', status: 'watched', rating: 0, runtime_minutes: 200 }, // real
      2: { media_type: 'movie', status: 'watched', rating: 0 }, // falls back to 110
    }
    const stats = computeStats([], library, {})
    expect(stats.totalHours).toBe(Math.round((200 + 110) / 60))
  })

  it('sums real per-episode runtime the same way', () => {
    const episodes = {
      'a-1-1': { runtime_minutes: 60 },
      'a-1-2': {}, // falls back to the 42min average
    }
    const stats = computeStats([], {}, episodes)
    expect(stats.totalEpisodes).toBe(2)
    expect(stats.totalHours).toBe(Math.round((60 + 42) / 60))
  })

  it('ignores unwatched/non-movie library rows for the movie count', () => {
    const library = {
      1: { media_type: 'movie', status: 'watchlist', rating: 0 }, // not watched
      2: { media_type: 'tv', status: 'watched', rating: 0 }, // not a movie
    }
    const stats = computeStats([], library, {})
    expect(stats.totalMovies).toBe(0)
    expect(stats.totalHours).toBe(0)
  })
})

describe('formatHours', () => {
  it('formats zero', () => { expect(formatHours(0)).toBe('0 hours') })
  it('formats under a day', () => { expect(formatHours(5)).toBe('5 hours') })
  it('formats a single hour without pluralising', () => { expect(formatHours(1)).toBe('1 hour') })
  it('formats multi-day totals with remaining hours', () => { expect(formatHours(50)).toBe('2 days, 2h') })
  it('formats exact multi-day totals without a dangling comma', () => { expect(formatHours(48)).toBe('2 days') })
})

import { describe, it, expect } from 'vitest'
import { assertAffected, sanitise, friendlyAuthError, DatabaseError } from './errors'

// assertAffected is the fix for M21 — PostgREST reports an RLS-filtered write
// as success (200/204, no error), which is what hid the signup username-loss
// bug (C4) and the undeletable-hidden-comment bug (C8) for weeks. These
// tests pin the exact contract every mutation call site now depends on.
describe('assertAffected', () => {
  it('throws when the query itself errored', () => {
    expect(() => assertAffected({ data: null, error: { message: 'boom' } }, 'testOp'))
      .toThrow(DatabaseError)
  })

  it('throws when the write affected zero rows, even with no error', () => {
    // This is the exact shape PostgREST returns for an RLS-filtered no-op —
    // the bug this function exists to catch.
    expect(() => assertAffected({ data: [], error: null }, 'testOp'))
      .toThrow(/affected no rows/)
  })

  it('throws when a .single()-style zero-row result comes back as null', () => {
    expect(() => assertAffected({ data: null, error: null }, 'testOp'))
      .toThrow(/affected no rows/)
  })

  it('passes through the data on a real single-row write', () => {
    const row = { id: 1, title: 'test' }
    expect(assertAffected({ data: row, error: null }, 'testOp')).toBe(row)
  })

  it('passes through the data on a real multi-row write', () => {
    const rows = [{ id: 1 }, { id: 2 }]
    expect(assertAffected({ data: rows, error: null }, 'testOp')).toBe(rows)
  })
})

describe('sanitise', () => {
  it('trims whitespace', () => {
    expect(sanitise('  hello  ')).toBe('hello')
  })

  it('strips null bytes', () => {
    expect(sanitise('hel\0lo')).toBe('hello')
  })

  it('caps length', () => {
    expect(sanitise('a'.repeat(20), 5)).toBe('aaaaa')
  })

  it('returns an empty string for non-string input rather than throwing', () => {
    expect(sanitise(null)).toBe('')
    expect(sanitise(undefined)).toBe('')
    expect(sanitise(42)).toBe('')
  })
})

describe('friendlyAuthError', () => {
  it('maps known Supabase error substrings to friendly messages', () => {
    expect(friendlyAuthError('Invalid login credentials')).toMatch(/Incorrect email or password/)
    expect(friendlyAuthError('User already registered')).toMatch(/already exists/)
  })

  it('falls back to the original message for unrecognised errors', () => {
    expect(friendlyAuthError('some unmapped error')).toBe('some unmapped error')
  })
})

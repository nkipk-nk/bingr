import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import UserProfilePage from './UserProfilePage'
import { ToastProvider } from '../contexts/ToastContext'

// C1 was a temporal-dead-zone ReferenceError: a useMemo on line 14 referenced
// `diary` in its dependency array one line before the useState declaring it.
// That crashed every /@username page, in production, for an unknown period —
// ESLint's react-hooks/immutability rule catches this pattern too (and is
// now part of CI), but this test pins the actual runtime behaviour: mounting
// the component must not throw, regardless of what the mocked queries
// resolve to. If this specific ordering regresses, this test fails at
// render time with the same ReferenceError users would have hit.
vi.mock('../lib/supabase', () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
  }
  return { supabase: { from: vi.fn(() => builder) } }
})

describe('UserProfilePage', () => {
  it('renders without throwing for a profile-not-found result (regression test for C1)', async () => {
    render(
      <ToastProvider>
        <UserProfilePage
          username="someone"
          onOpenItem={() => {}}
          onSignUp={() => {}}
          currentUserId={null}
          followsHook={null}
        />
      </ToastProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/profile not found/i)).toBeInTheDocument()
    })
  })

  it('renders a not-found state immediately when no username is given, without throwing', () => {
    render(
      <ToastProvider>
        <UserProfilePage
          username={null}
          onOpenItem={() => {}}
          onSignUp={() => {}}
          currentUserId={null}
          followsHook={null}
        />
      </ToastProvider>
    )
    expect(screen.getByText(/profile not found/i)).toBeInTheDocument()
  })
})

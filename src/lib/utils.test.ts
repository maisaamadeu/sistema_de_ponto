import { describe, expect, it } from 'vitest'

import { cn } from '@/lib/utils'

describe('cn', () => {
  it('mescla classes Tailwind sem conflitos', () => {
    expect(cn('px-2 py-1', 'px-4')).toContain('px-4')
    expect(cn('px-2 py-1', undefined, 'rounded')).toContain('rounded')
    expect(cn('px-2 py-1', undefined, 'rounded')).not.toContain('hidden')
  })
})

import { describe, it, expect } from 'vitest'
import { getCurrencySymbol } from '@/lib/excel-export'

describe('Currency Utils', () => {
  it('should return correct currency symbols', () => {
    expect(getCurrencySymbol('MYR')).toBe('RM')
    expect(getCurrencySymbol('USD')).toBe('$')
    expect(getCurrencySymbol('EUR')).toBe('€')
    expect(getCurrencySymbol('GBP')).toBe('£')
    expect(getCurrencySymbol('SGD')).toBe('S$')
    expect(getCurrencySymbol('INVALID')).toBe('RM') // Default fallback is RM
  })
})

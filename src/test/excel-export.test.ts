import { describe, it, expect, vi } from 'vitest'
import { exportTimesheetsToExcel } from '@/lib/excel-export'

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}))

describe('Excel Export', () => {
  it('should export timesheets to Excel format', () => {
    const mockTimesheets = [
      {
        date: '2024-01-01',
        project: 'Test Project',
        client: 'Test Client',
        hours: 8,
        description: 'Test work',
        billable: true,
        hourlyRate: 50,
        total: 400
      }
    ]

    expect(() => exportTimesheetsToExcel(mockTimesheets)).not.toThrow()
  })

  it('should handle empty timesheets array', () => {
    expect(() => exportTimesheetsToExcel([])).not.toThrow()
  })
})

import { describe, it, expect } from 'vitest'
import { parseBodyweight } from './import-csv.js'

describe('Apple Health bodyweight import', () => {
  it('converts mixed per-record kg and lb units independently', () => {
    const xml = '<HealthData>' +
      '<Record type="HKQuantityTypeIdentifierBodyMass" value="80" unit="kg" startDate="2026-01-01 08:00:00 +0000" />' +
      '<Record type="HKQuantityTypeIdentifierBodyMass" value="176.4" unit="lb" startDate="2026-01-02 08:00:00 +0000" />' +
      '</HealthData>'
    const result = parseBodyweight(xml, { unit: 'kg' })
    expect(result.bodyweight.map(x => x.w)).toEqual([80, 80])
    expect(result.converted).toBe(true)
  })
})

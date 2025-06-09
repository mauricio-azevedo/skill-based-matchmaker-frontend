import { describe, it, expect } from 'vitest'
import { generateMatches } from './algorithm'
import type { Player } from '../context/PlayersContext.tsx'

let id = 0
const make = (level: number): Player => ({ id: `${++id}`, name: `P${id}`, level })

describe('generateMatches mismatched level counts', () => {
  it('returns no matches when level distribution prevents pairs', () => {
    const players = [make(1), make(1), make(1), make(2)]
    expect(generateMatches(players)).toEqual([])
  })

  it('only pairs teams with identical level counts', () => {
    const players = [make(1), make(1), make(1), make(1), make(2), make(2)]
    const matches = generateMatches(players)
    expect(matches).toHaveLength(1)
    expect(matches[0].teamA.every(p => p.level === 1)).toBe(true)
    expect(matches[0].teamB.every(p => p.level === 1)).toBe(true)
  })
})

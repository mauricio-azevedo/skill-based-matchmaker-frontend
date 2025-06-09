import assert from 'node:assert'
import { generateMatches } from '../src/lib/algorithm'
import type { Player } from '../src/context/PlayersContext'

function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: String(i), name: `P${i}`, level: 1 }))
}

function testAllPlayersIncluded() {
  const players = makePlayers(5)
  const { counts } = generateMatches(players, 2)
  for (const p of players) {
    assert.ok(counts[p.id] >= 1, `player ${p.id} missing`)
  }
}

function testReuseFairness() {
  const players = makePlayers(5)
  const { counts } = generateMatches(players, 2)
  const values = Object.values(counts)
  const max = Math.max(...values)
  const min = Math.min(...values)
  assert.ok(max - min <= 1, `counts not balanced: ${JSON.stringify(counts)}`)
}

try {
  testAllPlayersIncluded()
  testReuseFairness()
  console.log('all tests passed')
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}

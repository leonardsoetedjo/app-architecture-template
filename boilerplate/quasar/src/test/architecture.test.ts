/**
 * Architecture tests for Quasar boilerplate.
 *
 * Rule Coverage:
 *   - DDD-DOMAIN-PURITY-QUASAR: features/{feature}/types/ must not import vue/quasar/pinia/axios
 *   - QUASAR-COMPOSABLE-PATTERN: .vue files must not contain business logic (no API calls)
 *   - QUASAR-API-ISOLATION: .vue files must not import axios directly
 *
 * These are static-analysis tests. No runtime needed.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const SRC_ROOT = join(__dirname, '..', 'src')

// --- Helpers ---

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      yield* walk(full)
    } else {
      yield full
    }
  }
}

// --- DDD-DOMAIN-PURITY-QUASAR ---

describe('DDD-DOMAIN-PURITY-QUASAR', () => {
  it('features/*/types/ must not import vue, quasar, pinia, or axios', () => {
    const forbidden = ['vue', 'quasar', 'pinia', 'axios']
    let violations: string[] = []

    for (const file of walk(SRC_ROOT)) {
      if (!file.includes('/features/') || !file.includes('/types/')) continue
      if (!file.endsWith('.ts')) continue

      const content = readFileSync(file, 'utf-8')
      for (const mod of forbidden) {
        if (content.includes(`from '${mod}'`) || content.includes(`from "${mod}"`)) {
          violations.push(`${file}: imports '${mod}'`)
        }
        if (content.includes(`import '${mod}'`) || content.includes(`import "${mod}"`)) {
          violations.push(`${file}: imports '${mod}'`)
        }
      }
    }

    if (violations.length > 0) {
      console.error('Domain purity violations:\n  ' + violations.join('\n  '))
    }
    expect(violations).toEqual([])
  })
})

// --- QUASAR-COMPOSABLE-PATTERN ---

describe('QUASAR-COMPOSABLE-PATTERN', () => {
  it('.vue files must not contain axios HTTP calls', () => {
    let violations: string[] = []

    for (const file of walk(SRC_ROOT)) {
      if (!file.endsWith('.vue')) continue
      const content = readFileSync(file, 'utf-8')
      if (content.includes('axios.')) {
        violations.push(`${file}: contains axios.`)
      }
      if (content.includes('fetch(')) {
        violations.push(`${file}: contains fetch().`)
      }
    }

    if (violations.length > 0) {
      console.error('Composable pattern violations:\n  ' + violations.join('\n  '))
    }
    expect(violations).toEqual([])
  })
})

// --- QUASAR-API-ISOLATION ---

describe('QUASAR-API-ISOLATION', () => {
  it('.vue files must not import axios', () => {
    let violations: string[] = []

    for (const file of walk(SRC_ROOT)) {
      if (!file.endsWith('.vue')) continue
      const content = readFileSync(file, 'utf-8')
      if (content.includes('axios') && (content.includes('import') || content.includes('from'))) {
        violations.push(`${file}: imports axios`)
      }
    }

    if (violations.length > 0) {
      console.error('API isolation violations:\n  ' + violations.join('\n  '))
    }
    expect(violations).toEqual([])
  })
})

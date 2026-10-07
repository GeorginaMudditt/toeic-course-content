'use client'

import { useCallback, useLayoutEffect, useRef, useState, type SetStateAction } from 'react'

function readStored<T>(key: string, parse: (value: unknown) => T): T | undefined {
  try {
    const raw = window.sessionStorage.getItem(key)
    if (raw == null) return undefined
    return parse(JSON.parse(raw))
  } catch {
    return undefined
  }
}

/**
 * State that survives leaving the page and coming back in the same browser tab.
 * A new tab, or closing this one, starts from the fallback again.
 */
export function useSessionState<T>(
  key: string,
  fallback: T,
  parse: (value: unknown) => T = (value) => value as T,
): [T, (value: SetStateAction<T>) => void] {
  const [value, setValue] = useState(fallback)
  const parseRef = useRef(parse)
  const fallbackRef = useRef(fallback)
  parseRef.current = parse
  fallbackRef.current = fallback

  useLayoutEffect(() => {
    const stored = readStored(key, parseRef.current)
    setValue(stored !== undefined ? stored : fallbackRef.current)
  }, [key])

  const setPersisted = useCallback(
    (next: SetStateAction<T>) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
        try {
          window.sessionStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // A full quota or private-mode restriction should not block the control.
        }
        return resolved
      })
    },
    [key],
  )

  return [value, setPersisted]
}

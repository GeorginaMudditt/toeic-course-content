/**
 * Auto-strike word-bank items when matching phrases appear in linked grammar gap inputs.
 * Mount on [data-word-bank-tracker]; scope defaults to the closest .section-block.
 */

function normalizePhrase(value: string): string {
  return value
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[.,!?;:()[\]"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readGrammarInputValue(container: Element): string {
  const textarea = container.querySelector('textarea')
  const textInput = container.querySelector('input[type="text"]')
  const select = container.querySelector('select')
  const checkedRadio = container.querySelector('input[type="radio"]:checked')

  if (textarea) return textarea.value
  if (select) return (select as HTMLSelectElement).value
  if (checkedRadio) return (checkedRadio as HTMLInputElement).value
  if (textInput) return (textInput as HTMLInputElement).value
  return ''
}

function resolveScope(bank: HTMLElement): HTMLElement | null {
  const scopeId = bank.getAttribute('data-word-bank-for')
  if (scopeId) {
    const byId = bank.ownerDocument.getElementById(scopeId)
    if (byId) return byId
  }
  return bank.closest('.section-block') as HTMLElement | null
}

function collectUsedPhrases(scope: HTMLElement): Set<string> {
  const used = new Set<string>()
  scope.querySelectorAll('[data-grammar-input]').forEach((container) => {
    const raw = readGrammarInputValue(container)
    if (!raw.trim()) return
    used.add(normalizePhrase(raw))
  })
  return used
}

function syncBank(bank: HTMLElement, scope: HTMLElement): void {
  const used = collectUsedPhrases(scope)
  bank.querySelectorAll<HTMLElement>('[data-word-bank-item]').forEach((item) => {
    const phrase = item.getAttribute('data-word-bank-item') || item.textContent || ''
    const isUsed = used.has(normalizePhrase(phrase))
    item.classList.toggle('word-bank-item--used', isUsed)
    item.setAttribute('aria-label', isUsed ? `${phrase} (used)` : phrase)
  })
}

export function syncWordBankTrackers(host: HTMLElement): void {
  host.querySelectorAll<HTMLElement>('[data-word-bank-tracker]').forEach((bank) => {
    const scope = resolveScope(bank)
    if (!scope) return
    syncBank(bank, scope)
  })
}

export function mountWordBankTracker(bank: HTMLElement): () => void {
  if (bank.getAttribute('data-word-bank-mounted') === 'true') {
    return () => {}
  }

  const scope = resolveScope(bank)
  if (!scope) {
    return () => {}
  }

  bank.setAttribute('data-word-bank-mounted', 'true')

  const runSync = () => syncBank(bank, scope)

  const onInput = (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (!scope.contains(target)) return
    if (!target.closest('[data-grammar-input]')) return
    runSync()
  }

  scope.addEventListener('input', onInput, true)
  scope.addEventListener('change', onInput, true)

  const observer = new MutationObserver(() => {
    runSync()
  })
  observer.observe(scope, { childList: true, subtree: true })

  runSync()
  const delayedSyncId = window.setTimeout(runSync, 100)

  return () => {
    window.clearTimeout(delayedSyncId)
    scope.removeEventListener('input', onInput, true)
    scope.removeEventListener('change', onInput, true)
    observer.disconnect()
    bank.removeAttribute('data-word-bank-mounted')
    bank.querySelectorAll('[data-word-bank-item]').forEach((item) => {
      item.classList.remove('word-bank-item--used')
      item.removeAttribute('aria-label')
    })
  }
}

export function mountWordBankTrackers(host: HTMLElement): () => void {
  const cleanups: Array<() => void> = []
  host.querySelectorAll<HTMLElement>('[data-word-bank-tracker]').forEach((bank) => {
    if (bank.getAttribute('data-word-bank-mounted') === 'true') return
    cleanups.push(mountWordBankTracker(bank))
  })
  return () => {
    cleanups.forEach((fn) => fn())
  }
}

/**
 * Aviation verbs gap-fill for "Vocabulary: Aircraft and Aviation" (#4).
 * Mount on an element with [data-ava-verbs-mount]. Audio: /vocab-audio/aircraft-aviation/verbs/{verb}.mp3
 */

const AUDIO_DIR = '/vocab-audio/aircraft-aviation/verbs/'

const SCENARIOS: ReadonlyArray<{ answer: string; before: string; after: string }> = [
  { answer: 'take off', before: 'The pilot started the engines and prepared to ', after: ' from the runway.' },
  { answer: 'descend', before: 'Before landing, the aircraft must ', after: ' altitude slowly.' },
  { answer: 'land', before: 'The plane will ', after: ' at the military base in twenty minutes.' },
  { answer: 'turn', before: 'The pilot had to ', after: ' the helicopter sharply to avoid the storm.' },
  { answer: 'jump', before: 'Paratroopers ', after: ' from the aircraft over the drop zone.' },
  { answer: 'abort', before: 'The control tower asked the pilot to ', after: ' the runway and circle again.' },
  { answer: 'inspect', before: 'Engineers ', after: ' the aircraft carefully before every flight.' },
  { answer: 'secure', before: 'The crew must ', after: ' the cargo securely before take-off.' },
  {
    answer: 'hover',
    before: 'The helicopter began to ',
    after: ' slowly above the landing zone before touching down.',
  },
  { answer: 'guide', before: 'Air traffic control will ', after: ' the pilot through restricted airspace.' },
  {
    answer: 'land',
    before: 'If an engine fails, the pilot must know how to ',
    after: ' the aircraft safely.',
  },
  {
    answer: 'request',
    before: 'The pilot radioed the tower to ',
    after: ' clearance for take-off.',
  },
]

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  let i = a.length
  let j: number
  let t: T
  while (i) {
    j = Math.floor(Math.random() * i--)
    t = a[i]!
    a[i] = a[j]!
    a[j] = t
  }
  return a
}

function norm(s: string | undefined | null): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

function slug(w: string): string {
  return norm(w).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function slotStyleForAnswer(answer: string): string {
  const len = answer.length
  const minW = Math.max(72, Math.round(len * 9.2 + 46))
  return (
    'box-sizing: border-box; min-width: ' +
    minW +
    'px; max-width: 100%; min-height: 40px; flex: 0 1 auto; border: 2px dashed #cbd5e1; border-radius: 8px; background: rgba(255,255,255,0.85); display: flex; flex-wrap: wrap; align-items: center; justify-content: center; transition: border-color 0.2s, background 0.2s; padding: 4px;'
  )
}

export function mountAircraftAviationVerbsGapFill(root: HTMLElement): () => void {
  let selectedChip: HTMLElement | null = null
  let rows: { slot: HTMLElement; expected: string }[] = []
  let bankEl: HTMLElement | null = null
  let feedbackEl: HTMLElement | null = null

  function clearSelection() {
    if (selectedChip) {
      selectedChip.classList.remove('ava-verb-chip-selected')
      selectedChip.style.boxShadow = '0 2px 4px rgba(186,54,39,0.12)'
      selectedChip.style.borderColor = '#ba3627'
      selectedChip = null
    }
  }

  function makeListenBtn(verb: string): HTMLElement {
    const id = `ava-v-audio-${slug(verb)}`
    const holder = document.createElement('span')
    holder.className = 'ava-no-print'
    holder.style.cssText = 'display: inline-flex; align-items: center; flex-shrink: 0;'

    const hit = document.createElement('button')
    hit.type = 'button'
    hit.className = 'ava-audio-hit'
    hit.setAttribute('aria-label', `Listen: ${verb}`)
    hit.textContent = '🔊'
    hit.title = 'Listen'
    hit.style.cssText =
      'width: 28px; height: 28px; padding: 0; border: none; border-radius: 50%; font-size: 13px; line-height: 1; cursor: pointer; background: #f5e6e4; box-shadow: 0 1px 3px rgba(0,0,0,0.2); flex-shrink: 0;'
    hit.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const a = root.querySelector(`#${CSS.escape(id)}`) as HTMLAudioElement | null
      void a?.play()
    })

    const audio = document.createElement('audio')
    audio.id = id
    audio.preload = 'auto'
    const source = document.createElement('source')
    source.src = `${AUDIO_DIR}${slug(verb)}.mp3`
    source.type = 'audio/mpeg'
    audio.appendChild(source)

    holder.appendChild(hit)
    holder.appendChild(audio)
    return holder
  }

  function findChipByLabel(label: string): HTMLElement | null {
    const all = root.querySelectorAll('.ava-verb-chip-wrap')
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement
      if (norm(el.dataset.word) === norm(label)) return el
    }
    return null
  }

  function chipWrapStyle(): string {
    return 'display: inline-flex; align-items: center; gap: 6px; font: 600 14px Arial, sans-serif; padding: 6px 10px; border-radius: 8px; border: 2px solid #ba3627; background: linear-gradient(180deg, #fef2f2 0%, #f5e6e4 100%); color: #1e293b; cursor: grab; box-shadow: 0 2px 4px rgba(186,54,39,0.12); user-select: none; touch-action: manipulation; min-width: 0; width: 100%; box-sizing: border-box;'
  }

  function makeChip(verb: string): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'ava-verb-chip-wrap'
    wrap.dataset.word = verb
    wrap.setAttribute('aria-label', verb)
    wrap.style.cssText = chipWrapStyle()

    wrap.appendChild(makeListenBtn(verb))

    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'ava-verb-chip'
    b.textContent = verb
    b.style.cssText =
      'font: inherit; font-weight: 700; border: none; background: transparent; color: inherit; cursor: grab; padding: 2px 0; flex: 1; min-width: 0; text-align: left;'
    wrap.appendChild(b)

    wrap.setAttribute('draggable', 'true')
    b.setAttribute('draggable', 'true')

    function onDragStart(e: DragEvent) {
      e.dataTransfer?.setData('text/plain', verb)
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
      wrap.style.opacity = '0.65'
    }
    function onDragEnd() {
      wrap.style.opacity = '1'
    }
    wrap.addEventListener('dragstart', onDragStart)
    wrap.addEventListener('dragend', onDragEnd)
    b.addEventListener('dragstart', onDragStart)
    b.addEventListener('dragend', onDragEnd)

    wrap.addEventListener('click', (e) => {
      if ((e.target as Element).closest('.ava-audio-hit')) return
      e.preventDefault()
      if (wrap.parentElement === bankEl) {
        clearSelection()
        selectedChip = wrap
        wrap.classList.add('ava-verb-chip-selected')
        wrap.style.boxShadow = '0 0 0 3px rgba(186,54,39,0.35), 0 2px 6px rgba(0,0,0,0.2)'
        wrap.style.borderColor = '#9a2d21'
        return
      }
      if (wrap.parentElement?.classList.contains('ava-verb-slot') && bankEl) {
        bankEl.appendChild(wrap)
        wrap.style.boxShadow = '0 2px 4px rgba(186,54,39,0.12)'
        wrap.style.borderColor = '#ba3627'
        clearSelection()
      }
    })

    return wrap
  }

  function placeInSlot(slot: HTMLElement, chipWrap: HTMLElement) {
    if (!bankEl) return
    while (slot.firstChild) {
      bankEl.appendChild(slot.firstChild as Node)
    }
    slot.appendChild(chipWrap)
    chipWrap.style.boxShadow = '0 2px 4px rgba(186,54,39,0.12)'
    chipWrap.style.borderColor = '#ba3627'
    clearSelection()
  }

  function slotClick(slot: HTMLElement) {
    return () => {
      if (selectedChip && selectedChip.parentElement === bankEl) {
        placeInSlot(slot, selectedChip)
        return
      }
      if (slot.firstChild && bankEl) {
        bankEl.appendChild(slot.firstChild as Node)
        clearSelection()
      }
    }
  }

  function checkAnswers() {
    let correct = 0
    rows.forEach((r) => {
      const slot = r.slot
      const wrap = slot.querySelector('.ava-verb-chip-wrap') as HTMLElement | null
      const exp = norm(r.expected)
      slot.classList.remove('ava-slot-correct', 'ava-slot-wrong', 'ava-shake')
      void slot.offsetWidth
      if (!wrap) {
        slot.classList.add('ava-slot-wrong', 'ava-shake')
        return
      }
      const got = norm(wrap.dataset.word)
      if (got === exp) {
        slot.classList.add('ava-slot-correct')
        correct++
      } else {
        slot.classList.add('ava-slot-wrong', 'ava-shake')
      }
    })
    if (feedbackEl) {
      if (correct === rows.length) {
        feedbackEl.textContent = `Excellent — all ${rows.length} sentences correct!`
        feedbackEl.style.color = '#15803d'
      } else {
        feedbackEl.textContent = `${correct} / ${rows.length} correct. Fix the red gaps and try again.`
        feedbackEl.style.color = '#92400e'
      }
    }
  }

  function build() {
    root.innerHTML = ''
    selectedChip = null
    rows = []

    const toolbar = document.createElement('div')
    toolbar.className = 'ava-no-print'
    toolbar.style.cssText =
      'display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 18px;'

    const btnCheck = document.createElement('button')
    btnCheck.type = 'button'
    btnCheck.textContent = 'Check answers'
    btnCheck.className = 'ava-check-answers-btn'
    btnCheck.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: none; background: linear-gradient(135deg, #ba3627 0%, #9a2d21 100%); color: #fff; cursor: pointer; box-shadow: 0 2px 6px rgba(186,54,39,0.35);'
    btnCheck.addEventListener('click', checkAnswers)

    const btnReset = document.createElement('button')
    btnReset.type = 'button'
    btnReset.textContent = 'Shuffle & reset'
    btnReset.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: 2px solid #ba3627; background: #fff; color: #ba3627; cursor: pointer;'
    btnReset.addEventListener('click', build)

    toolbar.appendChild(btnCheck)
    toolbar.appendChild(btnReset)

    feedbackEl = document.createElement('p')
    feedbackEl.setAttribute('role', 'status')
    feedbackEl.style.cssText = 'margin: 0; font-size: 15px; font-weight: 600; min-height: 22px; color: #1e3a5f;'
    toolbar.appendChild(feedbackEl)

    const board = document.createElement('div')
    board.className = 'ava-verb-board'
    root.appendChild(board)

    const order = shuffle(SCENARIOS.map((_, i) => i))
    const rowData: { slot: HTMLElement; expected: string }[] = []

    order.forEach((idx) => {
      const s = SCENARIOS[idx]!
      const row = document.createElement('div')
      row.className = 'ava-verb-row'
      row.style.cssText =
        'display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; background: linear-gradient(90deg, rgba(186,54,39,0.08) 0%, rgba(255,255,255,0.55) 100%); border-radius: 8px; border: 1px solid #e5e7eb;'

      const textWrap = document.createElement('div')
      textWrap.className = 'ava-verb-scenario'
      textWrap.style.cssText =
        'flex: 1; min-width: min(100%, 220px); font-size: 14px; line-height: 1.45; color: #1e293b; display: flex; flex-wrap: wrap; align-items: center; gap: 6px;'

      const beforeSpan = document.createElement('span')
      beforeSpan.textContent = s.before
      textWrap.appendChild(beforeSpan)

      const slot = document.createElement('div')
      slot.className = 'ava-verb-slot ava-slot'
      const baseSlotStyle = slotStyleForAnswer(s.answer)
      slot.style.cssText = baseSlotStyle
      slot.dataset.expected = s.answer
      slot.setAttribute('role', 'group')
      slot.setAttribute('aria-label', 'Choose verb for this sentence')
      slot.addEventListener('click', slotClick(slot))
      slot.addEventListener('dragover', (e) => {
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
        slot.style.borderColor = '#ba3627'
        slot.style.background = 'rgba(186,54,39,0.08)'
      })
      slot.addEventListener('dragleave', () => {
        slot.style.cssText = baseSlotStyle
      })
      slot.addEventListener('drop', (e) => {
        e.preventDefault()
        slot.style.cssText = baseSlotStyle
        const txt = e.dataTransfer?.getData('text/plain') ?? ''
        const chip = findChipByLabel(txt)
        if (chip) placeInSlot(slot, chip)
      })

      textWrap.appendChild(slot)

      const afterSpan = document.createElement('span')
      afterSpan.textContent = s.after
      textWrap.appendChild(afterSpan)

      row.appendChild(textWrap)
      board.appendChild(row)
      rowData.push({ slot, expected: s.answer })
    })

    rows = rowData

    const bankWrap = document.createElement('div')
    bankWrap.style.cssText =
      'padding: 16px; border-radius: 10px; background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%); box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);'
    root.appendChild(bankWrap)

    const bankTitle = document.createElement('div')
    bankTitle.textContent = 'Verb bank — drag or tap a verb, then tap the gap in the right sentence'
    bankTitle.className = 'ava-no-print'
    bankTitle.style.cssText =
      'font-size: 13px; font-weight: 700; color: #e8eaf6; margin-bottom: 10px; letter-spacing: 0.03em;'
    bankWrap.appendChild(bankTitle)

    bankEl = document.createElement('div')
    bankEl.className = 'ava-verb-bank-grid'
    bankWrap.appendChild(bankEl)

    const bankVerbs = [
      'take off',
      'land',
      'climb',
      'descend',
      'turn',
      'jump',
      'abort',
      'inspect',
      'secure',
      'hover',
      'guide',
      'request',
    ]
    shuffle(bankVerbs).forEach((v) => {
      bankEl!.appendChild(makeChip(v))
    })

    root.appendChild(toolbar)
  }

  build()

  return () => {
    root.innerHTML = ''
  }
}

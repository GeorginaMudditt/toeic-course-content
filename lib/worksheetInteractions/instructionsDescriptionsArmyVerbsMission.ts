/**
 * Vocabulary #2: Army action verbs — drag each verb into the right mission scenario.
 * Mount on an element with [data-ida-verbs-mount]. Audio: /vocab-audio/instructions-descriptions-army/{verb}.mp3
 */

const AUDIO_DIR = '/vocab-audio/instructions-descriptions-army/'

const SCENARIOS: ReadonlyArray<{ answer: string; before: string; after: string }> = [
  { answer: 'march', before: 'Soldiers ', after: ' in step across the parade ground.' },
  { answer: 'run', before: 'The recruits had to ', after: ' two kilometres in full kit before breakfast.' },
  { answer: 'climb', before: 'The patrol used ropes to ', after: ' the rocky ridge at dawn.' },
  { answer: 'carry', before: 'Two medics helped to ', after: ' the wounded soldier on a stretcher.' },
  { answer: 'shoot', before: 'On the range you may only ', after: ' at paper targets when instructed.' },
  { answer: 'protect', before: "The convoy's escort had to ", after: ' the vehicles from possible threats.' },
  { answer: 'follow', before: 'During the exercise every soldier must ', after: " the briefing and stick to the plan." },
  { answer: 'lead', before: 'An experienced corporal was chosen to ', after: ' the reconnaissance team.' },
  { answer: 'train', before: 'Units ', after: ' regularly so skills stay sharp between deployments.' },
  {
    answer: 'attack',
    before: 'In the simulation the platoon could not ',
    after: ' the village until HQ gave the order.',
  },
  { answer: 'defend', before: 'Their orders were to ', after: ' the checkpoint until relieved at 0600.' },
  { answer: 'rescue', before: 'Helicopters were launched to ', after: ' civilians trapped by the flooding.' },
  { answer: 'communicate', before: 'Clear radios help platoons ', after: ' when visibility is poor.' },
  { answer: 'listen', before: 'In the briefing room you must ', after: ' carefully to every safety instruction.' },
  { answer: 'observe', before: "The sentry's task was to ", after: ' the road and report any movement.' },
  { answer: 'prepare', before: 'Before the convoy moved out the crew had time to ', after: ' vehicles and equipment.' },
  { answer: 'build', before: 'Engineers were tasked to ', after: ' a temporary footbridge over the stream.' },
  { answer: 'repair', before: 'The workshop team worked through the night to ', after: ' the damaged truck.' },
  { answer: 'salute', before: 'All personnel ', after: ' when the national flag was raised.' },
  { answer: 'survive', before: 'After the exercise the instructor reminded them how to ', after: ' in extreme cold.' },
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

function displayVerb(verb: string): string {
  return verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase()
}

export function mountInstructionsDescriptionsArmyVerbsMission(root: HTMLElement): () => void {
  let selectedChip: HTMLElement | null = null
  let rows: { slot: HTMLElement; expected: string }[] = []
  let bankEl: HTMLElement | null = null
  let feedbackEl: HTMLElement | null = null

  function clearSelection() {
    if (selectedChip) {
      selectedChip.classList.remove('ida-verb-chip-selected')
      selectedChip.style.boxShadow = '0 2px 4px rgba(45,61,40,0.12)'
      selectedChip.style.borderColor = '#5c6f4e'
      selectedChip = null
    }
  }

  function makeListenBtn(verb: string): HTMLElement {
    const id = `ida-v-audio-${slug(verb)}`
    const holder = document.createElement('span')
    holder.className = 'ida-no-print'
    holder.style.cssText = 'display: inline-flex; align-items: center; flex-shrink: 0;'

    const hit = document.createElement('button')
    hit.type = 'button'
    hit.className = 'ida-audio-hit'
    hit.setAttribute('aria-label', `Listen: ${verb}`)
    hit.textContent = '🔊'
    hit.title = 'Listen'
    hit.style.cssText =
      'width: 28px; height: 28px; padding: 0; border: none; border-radius: 50%; font-size: 13px; line-height: 1; cursor: pointer; background: #f7f5ec; box-shadow: 0 1px 3px rgba(0,0,0,0.2); flex-shrink: 0;'
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
    const all = root.querySelectorAll('.ida-verb-chip-wrap')
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement
      if (el.dataset.word === label) return el
    }
    return null
  }

  function chipWrapStyle(): string {
    return 'display: inline-flex; align-items: center; gap: 6px; font: 600 14px Arial, sans-serif; padding: 6px 10px; border-radius: 8px; border: 2px solid #5c6f4e; background: linear-gradient(180deg, #f4f6ef 0%, #e2e6d8 100%); color: #1e2418; cursor: grab; box-shadow: 0 2px 4px rgba(45,61,40,0.12); user-select: none; touch-action: manipulation; min-width: 0; width: 100%; box-sizing: border-box;'
  }

  function slotStyle(): string {
    return 'min-width: 100px; max-width: 140px; min-height: 40px; flex: 0 0 auto; border: 2px dashed #8a9578; border-radius: 8px; background: rgba(255,255,255,0.85); display: flex; flex-wrap: wrap; align-items: center; justify-content: center; transition: border-color 0.2s, background 0.2s; padding: 4px;'
  }

  function makeChip(verb: string): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'ida-verb-chip-wrap'
    wrap.dataset.word = verb
    wrap.setAttribute('aria-label', verb)
    wrap.style.cssText = chipWrapStyle()

    wrap.appendChild(makeListenBtn(verb))

    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'ida-verb-chip'
    b.textContent = displayVerb(verb)
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
      if ((e.target as Element).closest('.ida-audio-hit')) return
      e.preventDefault()
      if (wrap.parentElement === bankEl) {
        clearSelection()
        selectedChip = wrap
        wrap.classList.add('ida-verb-chip-selected')
        wrap.style.boxShadow = '0 0 0 3px #b8a265, 0 2px 6px rgba(0,0,0,0.2)'
        wrap.style.borderColor = '#8a7340'
        return
      }
      if (wrap.parentElement?.classList.contains('ida-verb-slot') && bankEl) {
        bankEl.appendChild(wrap)
        wrap.style.boxShadow = '0 2px 4px rgba(45,61,40,0.12)'
        wrap.style.borderColor = '#5c6f4e'
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
    chipWrap.style.boxShadow = '0 2px 4px rgba(45,61,40,0.12)'
    chipWrap.style.borderColor = '#5c6f4e'
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
      const wrap = slot.querySelector('.ida-verb-chip-wrap') as HTMLElement | null
      const exp = norm(r.expected)
      slot.classList.remove('ida-slot-correct', 'ida-slot-wrong', 'ida-shake')
      void slot.offsetWidth
      if (!wrap) {
        slot.classList.add('ida-slot-wrong', 'ida-shake')
        return
      }
      const got = norm(wrap.dataset.word)
      if (got === exp) {
        slot.classList.add('ida-slot-correct')
        correct++
      } else {
        slot.classList.add('ida-slot-wrong', 'ida-shake')
      }
    })
    if (feedbackEl) {
      if (correct === rows.length) {
        feedbackEl.textContent = `Excellent — all ${rows.length} missions matched!`
        feedbackEl.style.color = '#2d5a27'
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
    toolbar.className = 'ida-no-print'
    toolbar.style.cssText =
      'display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 18px;'

    const btnCheck = document.createElement('button')
    btnCheck.type = 'button'
    btnCheck.textContent = 'Check answers'
    btnCheck.className = 'ida-check-answers-btn'
    btnCheck.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: none; background: linear-gradient(135deg, #4a5f3a 0%, #2d3d28 100%); color: #f7f5ec; cursor: pointer; box-shadow: 0 2px 6px rgba(45,61,40,0.35);'
    btnCheck.addEventListener('click', checkAnswers)

    const btnReset = document.createElement('button')
    btnReset.type = 'button'
    btnReset.textContent = 'Shuffle & reset'
    btnReset.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: 2px solid #5c6f4e; background: #fff; color: #2d3d28; cursor: pointer;'
    btnReset.addEventListener('click', build)

    toolbar.appendChild(btnCheck)
    toolbar.appendChild(btnReset)

    feedbackEl = document.createElement('p')
    feedbackEl.setAttribute('role', 'status')
    feedbackEl.style.cssText = 'margin: 0; font-size: 15px; font-weight: 600; min-height: 22px; color: #2d3d28;'
    toolbar.appendChild(feedbackEl)

    const board = document.createElement('div')
    board.className = 'ida-verb-board'
    root.appendChild(board)

    const order = shuffle(SCENARIOS.map((_, i) => i))
    const rowData: { slot: HTMLElement; expected: string }[] = []

    order.forEach((idx) => {
      const s = SCENARIOS[idx]!
      const row = document.createElement('div')
      row.className = 'ida-verb-row'
      row.style.cssText =
        'display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; background: linear-gradient(90deg, rgba(92,111,78,0.1) 0%, rgba(255,255,255,0.55) 100%); border-radius: 8px; border: 1px solid #d4d9c8;'

      const textWrap = document.createElement('div')
      textWrap.className = 'ida-verb-scenario'
      textWrap.style.cssText =
        'flex: 1; min-width: min(100%, 220px); font-size: 14px; line-height: 1.45; color: #1a2416; display: flex; flex-wrap: wrap; align-items: center; gap: 6px;'

      const beforeSpan = document.createElement('span')
      beforeSpan.textContent = s.before
      textWrap.appendChild(beforeSpan)

      const slot = document.createElement('div')
      slot.className = 'ida-verb-slot ida-slot'
      slot.style.cssText = slotStyle()
      slot.dataset.expected = s.answer
      slot.setAttribute('role', 'group')
      slot.setAttribute('aria-label', 'Choose verb for this scenario')
      slot.addEventListener('click', slotClick(slot))
      slot.addEventListener('dragover', (e) => {
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
        slot.style.borderColor = '#4a5f3a'
        slot.style.background = 'rgba(74,95,58,0.08)'
      })
      slot.addEventListener('dragleave', () => {
        slot.style.borderColor = ''
        slot.style.background = 'rgba(255,255,255,0.85)'
      })
      slot.addEventListener('drop', (e) => {
        e.preventDefault()
        slot.style.borderColor = ''
        slot.style.background = 'rgba(255,255,255,0.85)'
        const txt = e.dataTransfer?.getData('text/plain') ?? ''
        const chip = findChipByLabel(norm(txt))
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
      'padding: 16px; border-radius: 10px; background: linear-gradient(135deg, #2d3d28 0%, #3d4f35 100%); box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);'
    root.appendChild(bankWrap)

    const bankTitle = document.createElement('div')
    bankTitle.textContent = 'Verb bank — drag or tap a verb, then tap the gap in the right sentence'
    bankTitle.className = 'ida-no-print'
    bankTitle.style.cssText =
      'font-size: 13px; font-weight: 700; color: #e8e4d4; margin-bottom: 10px; letter-spacing: 0.03em;'
    bankWrap.appendChild(bankTitle)

    bankEl = document.createElement('div')
    bankEl.className = 'ida-verb-bank-grid'
    bankWrap.appendChild(bankEl)

    const allVerbs = SCENARIOS.map((x) => x.answer)
    shuffle(allVerbs).forEach((v) => {
      bankEl!.appendChild(makeChip(v))
    })

    root.appendChild(toolbar)
  }

  build()

  return () => {
    root.innerHTML = ''
  }
}

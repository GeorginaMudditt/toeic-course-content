export interface ResourceBookmarkMountContext {
  assignmentId: string
  resourceId: string
  preventSave: boolean
  bookmarkedSlugs: Set<string>
  scrollToSection?: string | null
  onBookmarkChange?: (slug: string, bookmarked: boolean) => void
}

const STAR_OUTLINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`

const STAR_FILLED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`

function renderStarButton(bookmarked: boolean): string {
  return bookmarked ? STAR_FILLED_SVG : STAR_OUTLINE_SVG
}

async function toggleBookmark(
  ctx: ResourceBookmarkMountContext,
  sectionSlug: string,
  sectionLabel: string
): Promise<boolean> {
  const response = await fetch('/api/bookmarks/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignmentId: ctx.assignmentId,
      resourceId: ctx.resourceId,
      sectionSlug,
      sectionLabel,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update bookmark')
  }

  const data = (await response.json()) as { bookmarked: boolean }
  return data.bookmarked
}

function highlightSection(section: HTMLElement) {
  section.classList.add('resource-bookmark-scroll-target')
  section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.setTimeout(() => {
    section.classList.remove('resource-bookmark-scroll-target')
  }, 2400)
}

/** Wire bookmark stars onto sections marked with data-bookmarkable in worksheet HTML. */
export function mountResourceSectionBookmarks(
  root: HTMLElement,
  ctx: ResourceBookmarkMountContext
): () => void {
  if (root.getAttribute('data-resource-bookmarks-mounted') === 'true') {
    return () => {}
  }

  const cleanups: (() => void)[] = []
  const sections = Array.from(
    root.querySelectorAll<HTMLElement>('[data-bookmarkable]')
  )

  if (sections.length === 0) {
    return () => {}
  }

  if (!document.getElementById('resource-bookmark-styles')) {
    const style = document.createElement('style')
    style.id = 'resource-bookmark-styles'
    style.textContent = `
      .resource-bookmark-heading-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .resource-bookmark-star-btn {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.85);
        color: #64748b;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
      }
      .resource-bookmark-star-btn:hover {
        background: #fff;
        color: #d97706;
        transform: scale(1.05);
      }
      .resource-bookmark-star-btn.is-bookmarked {
        color: #d97706;
      }
      .resource-bookmark-star-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      .resource-bookmark-scroll-target {
        outline: 3px solid #f59e0b;
        outline-offset: 6px;
        border-radius: 8px;
        transition: outline-color 0.6s ease;
      }
    `
    document.head.appendChild(style)
    cleanups.push(() => {
      style.remove()
    })
  }

  sections.forEach((section) => {
    const sectionSlug = section.getAttribute('data-bookmarkable') || ''
    if (!sectionSlug) return

    const sectionLabel =
      section.getAttribute('data-bookmark-label') ||
      section.querySelector('h2')?.textContent?.trim() ||
      sectionSlug

    const heading = section.querySelector('h2')
    if (!heading || heading.closest('.resource-bookmark-heading-row')) return

    const row = document.createElement('div')
    row.className = 'resource-bookmark-heading-row'
    heading.parentNode?.insertBefore(row, heading)
    row.appendChild(heading)

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'resource-bookmark-star-btn'
    button.innerHTML = renderStarButton(ctx.bookmarkedSlugs.has(sectionSlug))
    button.setAttribute(
      'aria-label',
      ctx.bookmarkedSlugs.has(sectionSlug)
        ? `Remove "${sectionLabel}" from saved sections`
        : `Save "${sectionLabel}" to your dashboard`
    )
    if (ctx.bookmarkedSlugs.has(sectionSlug)) {
      button.classList.add('is-bookmarked')
    }
    if (ctx.preventSave) {
      button.disabled = true
      button.title = 'Bookmarks cannot be changed in teacher preview'
    }

    const handler = async () => {
      if (ctx.preventSave) return
      button.disabled = true
      try {
        const bookmarked = await toggleBookmark(ctx, sectionSlug, sectionLabel)
        button.innerHTML = renderStarButton(bookmarked)
        button.classList.toggle('is-bookmarked', bookmarked)
        button.setAttribute(
          'aria-label',
          bookmarked
            ? `Remove "${sectionLabel}" from saved sections`
            : `Save "${sectionLabel}" to your dashboard`
        )
        if (bookmarked) {
          ctx.bookmarkedSlugs.add(sectionSlug)
        } else {
          ctx.bookmarkedSlugs.delete(sectionSlug)
        }
        ctx.onBookmarkChange?.(sectionSlug, bookmarked)
      } catch {
        window.alert('Could not update your saved section. Please try again.')
      } finally {
        if (!ctx.preventSave) {
          button.disabled = false
        }
      }
    }

    button.addEventListener('click', handler)
    row.appendChild(button)
    cleanups.push(() => {
      button.removeEventListener('click', handler)
      if (row.parentNode) {
        row.parentNode.insertBefore(heading, row)
        row.remove()
      }
    })

    if (ctx.scrollToSection && sectionSlug === ctx.scrollToSection) {
      window.setTimeout(() => highlightSection(section), 300)
    }
  })

  root.setAttribute('data-resource-bookmarks-mounted', 'true')
  cleanups.push(() => {
    root.removeAttribute('data-resource-bookmarks-mounted')
  })

  return () => {
    cleanups.forEach((fn) => fn())
  }
}

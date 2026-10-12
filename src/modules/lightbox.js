/* ==========================================================================
   lightbox.js — Click-to-enlarge for hero and banner photographs
   --------------------------------------------------------------------------
   Vanilla JavaScript only: no frameworks, no external libraries.
   Goals
     - Every hero and banner <img> is wrapped in a <button type="button">
       that opens a native <dialog> showing the full-resolution photograph.
     - dialog: object-fit: contain, max 92vw × 88vh, never scaled above 2× natural size.
     - Caption: the image’s alt text.
     - Controls: visible close button, Esc dismisses, backdrop click dismisses.
     - Focus: trapped inside dialog, returns to the triggering button on close.
     - Body scroll: locked while open, restored on close.
     - Previous/Next buttons and arrow-key navigation for the 4 photos (hero & banners).
     - prefers-reduced-motion: reduce → dialog opens static, no animation.
     - @media print: dialog display: none — the 1-page A3 layout is untouched.
     - No JavaScript: each <img> is inside <a href="images/..." target="_blank" rel="noopener">
       so the full file opens in a new tab.
   ========================================================================== */

// ---------- Helpers ----------
function $(s, r = document) { return r.querySelector(s) }
function $$(s, r = document) { return Array.from(r.querySelectorAll(s)) }

function hasReducedMotion () {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---------- Selectors ----------
const SELECTORS = {
  imageBtn: '.lightbox-image-btn',
  dialog: '#lightbox-dialog',
  dialogClose: '#lightbox-close',
  dialogPrev: '#lightbox-prev',
  dialogNext: '#lightbox-next',
  dialogImg: '#lightbox-img',
  caption: '#lightbox-caption'
}

// ---------- State ----------
let allImages = []
let currentIndex = 0
let dialogOpen = false
let focusStack = []
const CLASS = { open: 'is-open', noScroll: 'no-scroll' }

// ---------- Ensure dialog exists with all required parts ----------
function ensureDialog () {
  let dialog = $(SELECTORS.dialog)
  if (!dialog) {
    dialog = document.createElement('dialog')
    dialog.id = 'lightbox-dialog'
    dialog.setAttribute('aria-hidden', 'true')
    document.body.appendChild(dialog)
  }
  dialog.setAttribute('aria-hidden', 'true')

  // Close button
  let closeBtn = $(SELECTORS.dialogClose)
  if (!closeBtn) {
    closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.id = 'lightbox-close'
    closeBtn.setAttribute('aria-label', 'Close dialog')
    closeBtn.textContent = '×'
    dialog.appendChild(closeBtn)
  }

  // Prev button
  let prevBtn = $(SELECTORS.dialogPrev)
  if (!prevBtn) {
    prevBtn = document.createElement('button')
    prevBtn.type = 'button'
    prevBtn.id = 'lightbox-prev'
    prevBtn.setAttribute('aria-label', 'Previous image')
    prevBtn.textContent = '‹'
    dialog.appendChild(prevBtn)
  }

  // Next button
  let nextBtn = $(SELECTORS.dialogNext)
  if (!nextBtn) {
    nextBtn = document.createElement('button')
    nextBtn.type = 'button'
    nextBtn.id = 'lightbox-next'
    nextBtn.setAttribute('aria-label', 'Next image')
    nextBtn.textContent = '›'
    dialog.appendChild(nextBtn)
  }

  // Image
  let dialogImg = $(SELECTORS.dialogImg)
  if (!dialogImg) {
    dialogImg = document.createElement('img')
    dialogImg.id = 'lightbox-img'
    dialogImg.setAttribute('loading', 'lazy')
    dialogImg.setAttribute('alt', '')
    dialog.appendChild(dialogImg)
  }

  // Caption
  let caption = $(SELECTORS.caption)
  if (!caption) {
    caption = document.createElement('p')
    caption.id = 'lightbox-caption'
    dialog.appendChild(caption)
  }

  // Print styles
  if (!document.getElementById('lightbox-print-style')) {
    const style = document.createElement('style')
    style.id = 'lightbox-print-style'
    style.textContent = '@media print { #lightbox-dialog { display: none !important; } }'
    document.head.appendChild(style)
  }

  return dialog
}

// ---------- Collect images ----------
function collectImages () {
  const images = []

  // hero images: from #hero section figures
  $$('#hero .hero__figure img').forEach((img) => {
    // Remove target="_blank" and rel="noopener" from parent <a> if present
    const link = img.closest('a')
    if (link) {
      link.removeAttribute('target')
      link.removeAttribute('rel')
      // Intercept click to open lightbox instead of navigating
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const btn = link.closest('.lightbox-image-btn') || link
        const idx = allImages.findIndex(i => i.el === btn || i.el === link)
        if (idx >= 0) {
          currentIndex = idx
          updateDialog()
          openDialog(() => btn.focus())
        }
      })
    }

    let btn = img.closest('.lightbox-image-btn')
    if (!btn) {
      // wrap the image in a button
      btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('aria-label', 'Click to enlarge')
      btn.setAttribute('data-kind', 'hero')
      btn.classList.add('lightbox-image-btn')
      img.parentNode.replaceChild(btn, img)
      btn.appendChild(img)
    }
    images.push({
      el: btn,
      img: img,
      src: img.currentSrc || img.src,
      alt: img.alt,
      kind: 'hero'
    })
  })

  // banner images: from .figure--banner figures
  $$('.figure--banner img').forEach((img) => {
    const link = img.closest('a')
    if (link) {
      link.removeAttribute('target')
      link.removeAttribute('rel')
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const btn = link.closest('.lightbox-image-btn') || link
        const idx = allImages.findIndex(i => i.el === btn || i.el === link)
        if (idx >= 0) {
          currentIndex = idx
          updateDialog()
          openDialog(() => btn.focus())
        }
      })
    }

    let btn = img.closest('.lightbox-image-btn')
    if (!btn) {
      btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('aria-label', 'Click to enlarge')
      btn.setAttribute('data-kind', 'banner')
      btn.classList.add('lightbox-image-btn')
      img.parentNode.replaceChild(btn, img)
      btn.appendChild(img)
    }
    images.push({
      el: btn,
      img: img,
      src: img.currentSrc || img.src,
      alt: img.alt,
      kind: 'banner'
    })
  })

  return images
}

// ---------- Dialog helpers ----------
function openDialog (onClose) {
  const dialog = $(SELECTORS.dialog)
  if (!dialog) return
  dialogOpen = true
  dialog.classList.add('is-open')
  dialog.setAttribute('aria-hidden', 'false')
  document.body.classList.add('no-scroll')
  if (onClose) focusStack.push(onClose)
  const closeBtn = $(SELECTORS.dialogClose)
  if (closeBtn) closeBtn.focus()
}

function closeDialog () {
  const dialog = $(SELECTORS.dialog)
  if (!dialog) return
  dialogOpen = false
  dialog.classList.remove('is-open')
  document.body.classList.remove('no-scroll')
  setTimeout(() => {
    dialog.setAttribute('aria-hidden', 'true')
    if (focusStack.length) {
      const fn = focusStack.pop()
      if (fn) fn()
    }
  }, 300)
}

// ---------- Update dialog content ----------
function updateDialog () {
  const imgInfo = allImages[currentIndex]
  const dialogImg = $(SELECTORS.dialogImg)
  const caption = $(SELECTORS.caption)
  if (!dialogImg || !caption || !imgInfo) return
  dialogImg.src = imgInfo.src
  dialogImg.alt = imgInfo.alt
  caption.textContent = imgInfo.alt || ''
  // reposition
  if (dialogOpen) {
    const dialog = $(SELECTORS.dialog)
    if (dialog) {
      dialog.style.left = `${(window.innerWidth - dialog.clientWidth) / 2}px`
      dialog.style.top = `${(window.innerHeight - dialog.clientHeight) / 2}px`
    }
  }
}

// ---------- Navigation ----------
function nextSlide () {
  currentIndex = (currentIndex + 1) % allImages.length
  updateDialog()
}
function prevSlide () {
  currentIndex = (currentIndex - 1 + allImages.length) % allImages.length
  updateDialog()
}

// ---------- Event handlers ----------
function onKeyDown (e) {
  if (!dialogOpen) return
  if (e.key === 'Escape') {
    e.preventDefault()
    closeDialog()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    nextSlide()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prevSlide()
  }
  // Tab trapping
  if (e.key === 'Tab') {
    const dialog = $(SELECTORS.dialog)
    const focusable = dialog?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

function onClickOutside (e) {
  if (!dialogOpen) return
  const dialog = $(SELECTORS.dialog)
  if (dialog && e.target === dialog) {
    closeDialog()
  }
}

// ---------- Public API ----------
export function initLightbox () {
  // Ensure dialog exists with all parts
  ensureDialog()

  allImages = collectImages()
  if (allImages.length === 0) return

  // Attach click handlers to each image button
  allImages.forEach((info, idx) => {
    info.el.addEventListener('click', () => {
      currentIndex = idx
      updateDialog()
      openDialog(() => info.el.focus())
    })
  })

  // Dialog close button
  const closeBtn = $(SELECTORS.dialogClose)
  if (closeBtn) closeBtn.addEventListener('click', closeDialog)

  // Navigation buttons
  const prevBtn = $(SELECTORS.dialogPrev)
  if (prevBtn) prevBtn.addEventListener('click', prevSlide)
  const nextBtn = $(SELECTORS.dialogNext)
  if (nextBtn) nextBtn.addEventListener('click', nextSlide)

  // Keyboard
  document.addEventListener('keydown', onKeyDown)

  // Backdrop click
  const dialog = $(SELECTORS.dialog)
  if (dialog) dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog()
  })

  // Reduced motion: handled by CSS

  // Print: hide dialog (already added in ensureDialog)
}

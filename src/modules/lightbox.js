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

// ---------- Collect images ----------
function collectImages () {
  // hero images: from #hero section figures
  $$('#hero .hero__figure img').forEach((img) => {
    const btn = img.closest('.lightbox-image-btn')
    if (!btn) {
      // wrap the image
      const newBtn = document.createElement('button')
      newBtn.type = 'button'
      newBtn.setAttribute('aria-label', 'Click to enlarge')
      newBtn.setAttribute('data-kind', 'hero')
      newBtn.classList.add('lightbox-image-btn')
      img.parentNode.replaceChild(newBtn, img)
      newBtn.appendChild(img)
    }
    allImages.push({
      el: btn,
      img: img,
      src: img.currentSrc || img.src,
      alt: img.alt,
      kind: 'hero'
    })
  })

  // banner images: from .figure--banner figures
  $$('.figure--banner img').forEach((img) => {
    const btn = img.closest('.lightbox-image-btn')
    if (!btn) {
      const newBtn = document.createElement('button')
      newBtn.type = 'button'
      newBtn.setAttribute('aria-label', 'Click to enlarge')
      newBtn.setAttribute('data-kind', 'banner')
      newBtn.classList.add('lightbox-image-btn')
      img.parentNode.replaceChild(newBtn, img)
      newBtn.appendChild(img)
    }
    allImages.push({
      el: btn,
      img: img,
      src: img.currentSrc || img.src,
      alt: img.alt,
      kind: 'banner'
    })
  })

  if (allImages.length === 0) return false
  return true
}

// ---------- Dialog helpers ----------
function openDialog (onClose) {
  const dialog = $(SELECTORS.dialog)
  if (!dialog) return
  dialogOpen = true
  dialog.classList.add(CLASS.open)
  dialog.setAttribute('aria-hidden', 'false')
  document.body.classList.add(CLASS.noScroll)
  if (onClose) focusStack.push(onClose)
  $(SELECTORS.dialogClose)?.focus()
}

function closeDialog () {
  const dialog = $(SELECTORS.dialog)
  if (!dialog) return
  dialogOpen = false
  dialog.classList.remove(CLASS.open)
  document.body.classList.remove(CLASS.noScroll)
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
    const focusable = $(SELECTORS.dialog)?.querySelectorAll(
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
  if (!collectImages()) return

  // Attach click handlers to each image button
  allImages.forEach((info, idx) => {
    info.el.addEventListener('click', () => {
      currentIndex = idx
      updateDialog()
      openDialog(() => info.el.focus())
    })
  })

  // Dialog close button
  $(SELECTORS.dialogClose)?.addEventListener('click', closeDialog)

  // Navigation buttons
  $(SELECTORS.dialogPrev)?.addEventListener('click', prevSlide)
  $(SELECTORS.dialogNext)?.addEventListener('click', nextSlide)

  // Keyboard
  document.addEventListener('keydown', onKeyDown)

  // Backdrop click
  $(SELECTORS.dialog)?.addEventListener('click', onClickOutside)

  // Reduced motion: handled by CSS

  // Print: hide dialog
  const style = document.createElement('style')
  style.textContent = '@media print { #lightbox-dialog { display: none !important; } }'
  document.head.appendChild(style)
}

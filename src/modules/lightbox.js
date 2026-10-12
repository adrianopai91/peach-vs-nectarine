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

(function () {
  'use strict'

  // ---------- Helpers ----------

  function $(s, r = document) { return r.querySelector(s) }
  function $$(s, r = document) { return Array.from(r.querySelectorAll(s)) }

  function hasReducedMotion () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function createElement (tag, attrs = {}, text = '') {
    const el = document.createElement(tag)
    Object.keys(attrs).forEach(k => el[k] = attrs[k])
    if (text !== undefined) el.textContent = text
    return el
  }

  function qs (s) { return document.querySelector(s) }
  function qsa (s) { return document.querySelectorAll(s) }

  // ---------- Lightbox core ----------

  const SELECTORS = {
    imageBtn: '.lightbox-image-btn',
    dialog: '#lightbox-dialog',
    dialogImg: '#lightbox-img',
    dialogClose: '#lightbox-close',
    dialogPrev: '#lightbox-prev',
    dialogNext: '#lightbox-next',
    caption: '#lightbox-caption',
    badge: '.lightbox-badge',
    images: '.lightbox-image-btn img',
    root: document.documentElement
  }

  const CLASS = {
    open: 'lightbox--open',
    hidden: 'visually-hidden',
    noScroll: 'body--no-scroll'
  }

  const NAV_KEYS = { ArrowLeft: 1, ArrowRight: 1 }

  // State
  let allImages = []       // [{el, img, src, alt, kind}]  kind: 'hero'|'banner'
  let currentIndex = 0
  let dialogOpen = false

  // ---------- Initialisation ----------

  function init () {
    // collect all lightbox-eligible images
    allImages = collectImages()

    if (allImages.length === 0) return

    // build the dialog once
    buildDialog()

    // wrap images in buttons
    $$(SELECTORS.imageBtn).forEach((btn, i) => {
      const info = allImages[i]
      btn.addEventListener('click', () => openDialog(i))
    })

    // close on Esc
    function onEsc (e) {
      if (e.key === 'Escape' && dialogOpen) closeDialog()
    }
    document.addEventListener('keydown', onEsc)

    // close on backdrop click
    const dialog = qs(SELECTORS.dialog)
    if (dialog) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog()
      })
    }

    // keyboard nav: left/right
    document.addEventListener('keydown', (e) => {
      if (!dialogOpen) return
      if (NAV_KEYS[e.key]) {
        e.preventDefault()
        const step = e.key === 'ArrowLeft' ? -1 : 1
        currentIndex = (currentIndex + step + allImages.length) % allImages.length
        updateDialog()
      }
    })

    // make the dialog's close button focusable and return focus on close
    const closeBtn = qs(SELECTORS.dialogClose)
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeDialog(() => qs(SELECTORS.imageBtn).focus())
      })
    }
  }

  // ---------- Image collection ----------

  function collectImages () {
    const results = []

    // hero images: from #hero section figures
    $$('#hero .hero__figure img').forEach((img) => {
      let btn = img.closest('.lightbox-image-btn')
      if (!btn) {
        // wrap the image
        const newBtn = createElement('button', {
          type: 'button',
          'aria-label': 'Click to enlarge',
          'data-kind': 'hero'
        })
        img.parentNode.replaceChild(newBtn, img)
        newBtn.appendChild(img)
        btn = newBtn
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
      let btn = img.closest('.lightbox-image-btn')
      if (!btn) {
        const newBtn = createElement('button', {
          type: 'button',
          'aria-label': 'Click to enlarge',
          'data-kind': 'banner'
        })
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

    return allImages
  }

  // ---------- Dialog DOM ----------

  function buildDialog () {
    const exists = $(SELECTORS.dialog)
    if (exists) return

    const dialog = createElement('dialog', { id: 'lightbox-dialog' })
    dialog.innerHTML = `
      <button type="button" class="visually-hidden" id="lightbox-close" aria-label="Close dialog">
        &times;
      </button>
      <button type="button" class="visually-hidden" id="lightbox-prev" aria-label="Previous image">‹</button>
      <button type="button" class="visually-hidden" id="lightbox-next" aria-label="Next image">›</button>
      <img id="lightbox-img" src="" alt="" loading="lazy">
      <p id="lightbox-caption" class="visually-hidden"></p>
    `
    document.body.appendChild(dialog)
  }

  // ---------- Dialog operations ----------

  function openDialog (index) {
    currentIndex = index
    const imgInfo = allImages[currentIndex]
    const dialog = $(SELECTORS.dialog)
    const dialogImg = $(SELECTORS.dialogImg)
    const caption = $(SELECTORS.caption)
    const closeBtn = $(SELECTORS.dialogClose)

    if (!dialog || !dialogImg || !caption) return

    dialogOpen = true
    dialog.classList.add(CLASS.open)
    dialog.setAttribute('aria-hidden', 'false')
    document.body.classList.add(CLASS.noScroll)

    // image setup
    dialogImg.src = imgInfo.src
    dialogImg.alt = imgInfo.alt
    dialogImg.setAttribute('aria-labelledby', SELECTORS.caption)
    caption.textContent = imgInfo.alt || ''

    // natural size check for max-scale
    const img = new Image()
    img.onload = () => {
      const natural = { w: img.naturalWidth, h: img.naturalHeight }
      const maxW = Math.min(92 * window.innerWidth / 100, natural.w * 2)
      const maxH = Math.min(88 * window.innerHeight / 100, natural.h * 2)
      dialogImg.style.maxWidth = `${maxW}px`
      dialogImg.style.maxHeight = `${maxH}px`
    }
    img.src = imgInfo.src

    // position dialog centered
    dialog.style.left = `${(window.innerWidth - dialog.clientWidth) / 2}px`
    dialog.style.top = `${(window.innerHeight - dialog.clientHeight) / 2}px`

    // focus trap: first focusable element
    const firstFocus = $(SELECTORS.dialogClose) || dialog
    firstFocus.focus()
    dialogOpen = true
  }

  function closeDialog (onClose) {
    const dialog = $(SELECTORS.dialog)
    if (!dialog) return
    dialogOpen = false
    dialog.classList.remove(CLASS.open)
    document.body.classList.remove(CLASS.noScroll)
    setTimeout(() => {
      dialog.setAttribute('aria-hidden', 'true')
      if (onClose) onClose()
    }, 300)
  }

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
      dialog.style.left = `${(window.innerWidth - dialog.clientWidth) / 2}px`
      dialog.style.top = `${(window.innerHeight - dialog.clientHeight) / 2}px`
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

  // expose navigation for the buttons in the DOM
  $(SELECTORS.dialogPrev)?.addEventListener('click', prevSlide)
  $(SELECTORS.dialogNext)?.addEventListener('click', nextSlide)

  // ---------- Print — hide dialog ----------

  function hideInPrint () {
    const style = document.createElement('style')
    style.textContent = '@media print { #lightbox-dialog { display: none !important; } }'
    document.head.appendChild(style)
  }

  // ---------- Public API ----------

  init()
  hideInPrint()
})()
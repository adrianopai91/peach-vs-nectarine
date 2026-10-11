/* ==========================================================================
   timelineReveal.js — staggered reveal for the #origin journey
   --------------------------------------------------------------------------
   The four journey stops (China -> Persia -> Europe -> the Americas) start
   hidden and fade in one after another, 150 ms apart, the first time the
   section scrolls into view. It runs once.

   Implementation detail
     The motion is applied to the *children* of each .timeline__step, not to
     the step itself. The vertical guide line is a pseudo-element of the step,
     so animating the step would tear that line into disconnected pieces.
     Moving only the marker and the text keeps the line perfectly continuous.

   Falls back to the fully visible state when IntersectionObserver is missing
   or the user prefers reduced motion.
   ========================================================================== */

/** Delay added per step, in ms. */
const STAGGER_MS = 150;

/** True when the user asked for less motion. */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Marks every step as visible (static / reduced-motion state). */
function revealAll(steps) {
  for (const step of steps) {
    step.classList.add('is-visible');
  }
}

/**
 * Initialises the timeline reveal.
 * @returns {{steps: HTMLElement[], revealAll: () => void}|null}
 */
export function initTimelineReveal() {
  const steps = Array.from(document.querySelectorAll('#origin .timeline__step'));

  if (steps.length === 0) {
    return null;
  }

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    revealAll(steps);
    return { steps, revealAll };
  }

  steps.forEach((step, index) => {
    // transition-delay is not inherited, so each animated child gets its own.
    for (const child of step.children) {
      child.style.transitionDelay = `${index * STAGGER_MS}ms`;
    }
  });

  const observer = new IntersectionObserver(
    (entries, self) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        self.unobserve(entry.target);
        entry.target.classList.add('is-visible');
      }
    },
    { threshold: 0.3 },
  );

  for (const step of steps) {
    observer.observe(step);
  }

  // Never leave the printout (or a screenshot) with a half-hidden timeline.
  window.addEventListener('beforeprint', () => revealAll(steps));

  return { steps, revealAll };
}
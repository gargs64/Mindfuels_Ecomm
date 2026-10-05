// Shared Motion presets so overlays across the site move consistently.
// Uses independent transforms (x/y/scale) so <MotionConfig reducedMotion="user">
// can drop the movement and keep only the fade for users who prefer reduced motion.

const enter = { type: 'spring', bounce: 0.2, visualDuration: 0.3 };
const exit = { duration: 0.15, ease: 'easeIn' };

// Dimmed full-screen backdrops (product modal, search overlay)
export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
};

// Centred dialog panels
export const dialogMotion = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: enter },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: exit }
};

// Bottom sheet used for the product modal on phones
export const sheetMotion = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'spring', bounce: 0, visualDuration: 0.35 } },
  exit: { y: '100%', transition: { duration: 0.22, ease: 'easeIn' } }
};

// Small popovers anchored under a navbar button (wishlist, account)
export const popoverMotion = {
  initial: { opacity: 0, scale: 0.96, y: -6 },
  animate: { opacity: 1, scale: 1, y: 0, transition: enter },
  exit: { opacity: 0, scale: 0.97, y: -4, transition: exit }
};

// Full-width mobile drawer that drops from under the navbar
export const drawerMotion = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0, visualDuration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: exit }
};

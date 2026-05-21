import type { HTMLMotionProps, Variants } from "framer-motion";

const duration = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.28,
} as const;

/** Delay between staggered list items (ms). Kept short so route changes feel snappy. */
export const STAGGER_CHILD_DELAY_MS = 24;

export const STAGGER_CHILD_DELAY_S = STAGGER_CHILD_DELAY_MS / 1000;

/** Standard easing: ease-out cubic */
const easeOut = [0.22, 1, 0.36, 1] as const;

const easeInOut = [0.45, 0, 0.55, 1] as const;

const transition = {
  duration: duration.normal,
  ease: easeOut,
};

const exitTransition = {
  duration: duration.fast,
  ease: easeInOut,
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition,
  },
  exit: {
    opacity: 0,
    transition: exitTransition,
  },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition,
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: exitTransition,
  },
};

/** Dashboard/report cards — visible immediately on route change. */
export const cardSlideUpMotion = {
  variants: slideUp,
  initial: false,
  animate: "animate",
} as const;

export const slideDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: {
    opacity: 1,
    y: 0,
    transition,
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: exitTransition,
  },
};

export const slideLeft: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition,
  },
  exit: {
    opacity: 0,
    x: 12,
    transition: exitTransition,
  },
};

export const slideRight: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition,
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: exitTransition,
  },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: exitTransition,
  },
};

export const staggerChildren: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: STAGGER_CHILD_DELAY_S,
      delayChildren: 0,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: exitTransition,
  },
};

/** Stagger list root — skips entrance delay on route change. */
export const listStaggerMotion = {
  variants: staggerChildren,
  initial: false,
  animate: "animate",
} as const;

/** Child of {@link listStaggerMotion}; avoids opacity:0 stuck state. */
export const listStaggerItemMotion = {
  variants: staggerItem,
  initial: false,
} as const;

/** Shared hover lift + shadow for cards (motion.div / motion.article). */
export const cardHoverMotion: Pick<
  HTMLMotionProps<"div">,
  "whileHover" | "transition"
> = {
  whileHover: {
    y: -2,
    boxShadow: "0 8px 24px rgba(44,36,22,0.12)",
  },
  transition: { duration: duration.fast },
};

/** Form / inline error copy — slides down when it appears. */
export const formErrorMessage: Variants = slideDown;

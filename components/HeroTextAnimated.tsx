'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';

interface HeroTextAnimatedProps {
  eyebrow: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  locale: string;
}

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.13,
      delayChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export default function HeroTextAnimated({
  eyebrow,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  locale,
}: HeroTextAnimatedProps) {
  const shouldReduceMotion = useReducedMotion();
  const arrow = locale === 'ar' ? '‹' : '›';
  const isRtl = locale === 'ar';

  const containerVariants = shouldReduceMotion ? undefined : container;
  const itemVariants = shouldReduceMotion ? undefined : item;
  const initialState = shouldReduceMotion ? false : 'hidden';
  const animateState = shouldReduceMotion ? undefined : 'visible';

  return (
    <motion.div
      variants={containerVariants}
      initial={initialState}
      animate={animateState}
    >
      <motion.p
        variants={itemVariants}
        style={{
          marginBottom: '1.25rem',
          fontSize: '0.75rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          color: 'var(--asc-accent)',
        }}
      >
        {eyebrow}
      </motion.p>

      <motion.h1
        variants={itemVariants}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          textTransform: 'uppercase',
          lineHeight: 1,
          color: 'var(--asc-fg-0)',
        }}
        className="text-6xl md:text-8xl"
      >
        RISE
        <br />
        <span
          style={{
            background: 'linear-gradient(100deg, #c9933e 0%, #f0e2ca 42%, #8f642f 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 32px rgba(184, 137, 61, 0.28))',
          }}
        >
          BEYOND LIMITS.
        </span>
      </motion.h1>

      <motion.p
        variants={itemVariants}
        style={{
          marginTop: '1.5rem',
          maxWidth: '36rem',
          fontSize: '1rem',
          lineHeight: 1.75,
          color: 'var(--asc-fg-2)',
        }}
      >
        {description}
      </motion.p>

      <motion.div
        variants={itemVariants}
        style={{
          marginTop: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <Link
          href={primaryHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#151412',
            background: 'linear-gradient(135deg, #c9933e 0%, #b8893d 55%, #9a6a2a 100%)',
            boxShadow: '0 0 28px rgba(184, 137, 61, 0.42), 0 4px 20px rgba(0,0,0,0.45)',
            clipPath:
              'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {primaryLabel}
          <span
            style={{
              marginLeft: isRtl ? 0 : '0.5rem',
              marginRight: isRtl ? '0.5rem' : 0,
            }}
          >
            {arrow}
          </span>
        </Link>

        <Link
          href={secondaryHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--asc-fg-2)',
            border: '1px solid var(--asc-line)',
            clipPath:
              'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            transition: 'opacity 0.2s ease',
          }}
        >
          {secondaryLabel}
        </Link>
      </motion.div>
    </motion.div>
  );
}

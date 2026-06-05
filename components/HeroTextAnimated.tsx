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
  stats?: { label: string; value: string }[];
}

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.58,
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
  stats = [],
}: HeroTextAnimatedProps) {
  const shouldReduceMotion = useReducedMotion();
  const arrow = locale === 'ar' ? '<' : '>';
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
        className="asc-home-hero-eyebrow"
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
        className="asc-home-hero-title text-6xl md:text-8xl"
      >
        RISE
        <br />
        <span className="asc-home-hero-title__accent">
          BEYOND LIMITS.
        </span>
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="asc-home-hero-description"
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

      {stats.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="asc-home-hero-stats"
        >
          {stats.map((stat) => (
            <span className="asc-home-hero-stat" key={stat.label}>
              <span className="asc-home-hero-stat__value">{stat.value}</span>
              <span className="asc-home-hero-stat__label">{stat.label}</span>
            </span>
          ))}
        </motion.div>
      )}

      <motion.div
        aria-hidden="true"
        className="asc-home-hero-power-strip"
        variants={itemVariants}
      >
        <span />
        <span />
        <span />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="asc-home-hero-actions"
        style={{
          marginTop: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <Link
          href={primaryHref}
          className="asc-home-hero-cta asc-home-hero-cta--primary"
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
          className="asc-home-hero-cta asc-home-hero-cta--secondary"
        >
          {secondaryLabel}
        </Link>
      </motion.div>
    </motion.div>
  );
}

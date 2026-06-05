// Route entrance transition. `template.tsx` re-mounts on every navigation,
// so the `.asc-page-enter` animation (opacity + 8px rise) replays per route.
// Pure CSS, server component, no client JS. Disabled under reduced motion.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="asc-page-enter">{children}</div>;
}

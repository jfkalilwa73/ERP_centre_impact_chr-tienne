/**
 * Motif décoratif reprenant la gerbe du logo Impact Centre Chrétien.
 * Les cinq brins partent d'un même point : rouge, bleu et vert s'ouvrent
 * vers la gauche, violet et or vers la droite, comme sur le logo.
 * Purement ornemental : masqué des technologies d'assistance.
 */
export function GerbeMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g strokeLinecap="round" strokeWidth="22">
        <path d="M200 312C178 208 120 96 32 18" stroke="var(--color-gerbe-rouge)" />
        <path d="M200 312C168 222 110 148 34 82" stroke="var(--color-gerbe-bleu)" />
        <path d="M200 312C193 250 180 160 166 98" stroke="var(--color-gerbe-vert)" strokeWidth="18" />
        <path d="M200 312C216 232 282 112 390 46" stroke="var(--color-gerbe-violet)" />
        <path d="M200 312C220 248 286 168 386 112" stroke="var(--color-gerbe-or)" />
      </g>
    </svg>
  )
}

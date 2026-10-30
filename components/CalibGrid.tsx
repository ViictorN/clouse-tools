/**
 * Calibration-grid backdrop: technical drawing paper behind hero and dark
 * bands. Purely decorative; masked so it never fights text contrast.
 */
export function CalibGrid({ full = false }: { full?: boolean }) {
  return <div className={`calib-grid${full ? ' full' : ''}`} aria-hidden="true" />;
}

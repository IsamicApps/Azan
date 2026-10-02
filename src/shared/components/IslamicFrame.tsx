import React from 'react';

/**
 * A modern Islamic border for the TV in fullscreen: a slim band of interlaced
 * eight-pointed stars (khatam) between two hairlines, with star rosettes at the
 * corners and smaller medallions at the middle of each edge. Coloured by the theme.
 */

// Outer hairline and band, in px from the screen edge (1920x1080 canvas)
const INSET = 8;
const BAND = 24;

/** "#d4af37" + 0.6 -> "rgba(212, 175, 55, 0.6)" (older TV browsers lack color-mix) */
function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Points of an eight-pointed star (outer and inner radius alternating). */
function starPoints(cx: number, cy: number, outer: number, inner: number, rotation = 0): string {
  return Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((i * 22.5 + rotation) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/** One repeating tile of the band: a star joined to its neighbours by a line, a small diamond between them. */
function bandTile(color: string, vertical: boolean): string {
  const s = BAND;
  const c = s / 2;
  const link = vertical
    ? `M${c},0 L${c},2 M${c},${s - 2} L${c},${s}`
    : `M0,${c} L2,${c} M${s - 2},${c} L${s},${c}`;
  const diamonds = vertical
    ? `M${c - 3},0 L${c},3 L${c + 3},0 M${c - 3},${s} L${c},${s - 3} L${c + 3},${s}`
    : `M0,${c - 3} L3,${c} L0,${c + 3} M${s},${c - 3} L${s - 3},${c} L${s},${c + 3}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <polygon points="${starPoints(c, c, 10, 5.2)}" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-opacity="0.75" stroke-width="1"/>
    <polygon points="${starPoints(c, c, 4.2, 2.4, 22.5)}" fill="${color}" fill-opacity="0.45"/>
    <path d="${link}" stroke="${color}" stroke-opacity="0.6" stroke-width="1"/>
    <path d="${diamonds}" fill="${color}" fill-opacity="0.35"/>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const Medallion: React.FC<{ color: string; size: number; className?: string; style?: React.CSSProperties }> = ({ color, size, className = '', style }) => (
  <svg viewBox="-50 -50 100 100" width={size} height={size} className={`absolute ${className}`} style={style} aria-hidden="true">
    <circle r="47" style={{ fill: 'var(--tv-strip, #0e121c)' }} stroke={color} strokeOpacity="0.85" strokeWidth="1.5" />
    <circle r="41" fill="none" stroke={color} strokeOpacity="0.4" strokeWidth="1" />
    {Array.from({ length: 8 }, (_, i) => {
      const a = ((i * 45 + 22.5) * Math.PI) / 180;
      return <circle key={i} cx={44 * Math.cos(a)} cy={44 * Math.sin(a)} r="1.6" fill={color} fillOpacity="0.8" />;
    })}
    <polygon points={starPoints(0, 0, 37, 20)} fill={color} fillOpacity="0.12" stroke={color} strokeOpacity="0.9" strokeWidth="1.4" strokeLinejoin="round" />
    <polygon points={starPoints(0, 0, 21, 12, 22.5)} fill={color} fillOpacity="0.28" stroke={color} strokeOpacity="0.7" strokeWidth="1" strokeLinejoin="round" />
    <circle r="6" fill={color} fillOpacity="0.9" />
  </svg>
);

export const IslamicFrame: React.FC<{ color: string }> = ({ color }) => {
  const line = `1px solid ${withAlpha(color, 0.6)}`;
  const faintLine = `1px solid ${withAlpha(color, 0.35)}`;
  const horizontal = bandTile(color, false);
  const vertical = bandTile(color, true);
  const band = (style: React.CSSProperties) => <div className="absolute" style={style} />;
  const corner = 76;
  // Corners sit just inside the screen edge; edge medallions are centred on the band
  const cornerAt = 0;
  const edge = 40;
  const edgeAt = INSET + BAND / 2 - edge / 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
      {/* Hairlines: outer, and inner with a soft glow into the screen */}
      <div className="absolute" style={{ inset: INSET, border: line, borderRadius: 6 }} />
      <div
        className="absolute"
        style={{
          inset: INSET + BAND,
          border: faintLine,
          borderRadius: 4,
          boxShadow: `inset 0 0 36px ${withAlpha(color, 0.1)}`
        }}
      />
      {/* The star band on each side */}
      {band({ top: INSET, left: INSET, right: INSET, height: BAND, backgroundImage: horizontal, backgroundRepeat: 'repeat-x', backgroundPosition: 'center' })}
      {band({ bottom: INSET, left: INSET, right: INSET, height: BAND, backgroundImage: horizontal, backgroundRepeat: 'repeat-x', backgroundPosition: 'center' })}
      {band({ top: INSET + BAND, bottom: INSET + BAND, left: INSET, width: BAND, backgroundImage: vertical, backgroundRepeat: 'repeat-y', backgroundPosition: 'center' })}
      {band({ top: INSET + BAND, bottom: INSET + BAND, right: INSET, width: BAND, backgroundImage: vertical, backgroundRepeat: 'repeat-y', backgroundPosition: 'center' })}
      {/* Rosettes at the corners, medallions at the middle of each edge */}
      <Medallion color={color} size={corner} style={{ top: cornerAt, left: cornerAt }} />
      <Medallion color={color} size={corner} style={{ top: cornerAt, right: cornerAt }} />
      <Medallion color={color} size={corner} style={{ bottom: cornerAt, left: cornerAt }} />
      <Medallion color={color} size={corner} style={{ bottom: cornerAt, right: cornerAt }} />
      <Medallion color={color} size={edge} style={{ top: edgeAt, left: `calc(50% - ${edge / 2}px)` }} />
      <Medallion color={color} size={edge} style={{ bottom: edgeAt, left: `calc(50% - ${edge / 2}px)` }} />
      <Medallion color={color} size={edge} style={{ left: edgeAt, top: `calc(50% - ${edge / 2}px)` }} />
      <Medallion color={color} size={edge} style={{ right: edgeAt, top: `calc(50% - ${edge / 2}px)` }} />
    </div>
  );
};

import React, { useId } from 'react';

/**
 * A modern, three-dimensional Islamic border for the TV in fullscreen: a bevelled
 * metal band of faceted eight-pointed stars (khatam), domed star rosettes at the
 * corners and medallions at the middle of each edge. Everything is lit from the top
 * left, and the screen sits recessed inside the frame. Coloured by the theme.
 */

// Band position and thickness, in px on the 1920x1080 canvas
const INSET = 6;
const BAND = 28;

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend towards white (amount > 0) or black (amount < 0). */
function shade([r, g, b]: Rgb, amount: number): Rgb {
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  return [r + (target - r) * t, g + (target - g) * t, b + (target - b) * t].map(Math.round) as Rgb;
}

const rgba = ([r, g, b]: Rgb, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

// Light comes from the top left (screen y points down)
const LIGHT = (-135 * Math.PI) / 180;

/** Brightness (-1 dark .. 1 lit) of a facet facing the given direction. */
const lit = (angle: number) => Math.cos(angle - LIGHT);

/**
 * An eight-pointed star as raised facets: each point is two triangles, the one
 * facing the light brighter, so the star reads as a carved pyramid.
 */
function facetedStar(cx: number, cy: number, outer: number, inner: number, base: Rgb, rotation = 0): string {
  const at = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)].map((v) => v.toFixed(2)).join(',');
  };
  let out = '';
  for (let i = 0; i < 8; i++) {
    const tip = i * 45 + rotation;
    for (const side of [-1, 1]) {
      const valley = tip + side * 22.5;
      // The facet faces outwards, between the tip and the valley
      const facing = ((tip + side * 11.25 + side * 45) * Math.PI) / 180;
      const fill = shade(base, lit(facing) * 0.55);
      out += `<polygon points="${at(0, 0)} ${at(outer, tip)} ${at(inner, valley)}" fill="${rgba(fill)}"/>`;
    }
  }
  return out;
}

/** A four-sided faceted diamond (a small pyramid). */
function facetedDiamond(cx: number, cy: number, r: number, base: Rgb): string {
  const pts: [number, number][] = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
  let out = '';
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const facing = Math.atan2((a[1] + b[1]) / 2 - cy, (a[0] + b[0]) / 2 - cx);
    out += `<polygon points="${cx},${cy} ${a.join(',')} ${b.join(',')}" fill="${rgba(shade(base, lit(facing) * 0.55))}"/>`;
  }
  return out;
}

/** One repeating tile of the band: a faceted star with a small diamond between neighbours. */
function bandTile(base: Rgb, vertical: boolean): string {
  const s = BAND;
  const c = s / 2;
  const diamonds = vertical
    ? facetedDiamond(c, 0, 3.2, base) + facetedDiamond(c, s, 3.2, base)
    : facetedDiamond(0, c, 3.2, base) + facetedDiamond(s, c, 3.2, base);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <circle cx="${c + 0.8}" cy="${c + 1.2}" r="10" fill="rgba(0,0,0,0.45)"/>
    ${facetedStar(c, c, 11, 5.4, base)}
    ${diamonds}
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** A domed medallion: bevelled metal ring with studs, a dark recessed field, a faceted star and a jewel. */
const Medallion: React.FC<{ base: Rgb; size: number; style: React.CSSProperties }> = ({ base, size, style }) => {
  const id = useId().replace(/:/g, '');
  const field = shade(base, -0.88);
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      className="absolute"
      style={{ ...style, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.75))' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={rgba(shade(base, 0.55))} />
          <stop offset="0.45" stopColor={rgba(base)} />
          <stop offset="1" stopColor={rgba(shade(base, -0.6))} />
        </linearGradient>
        <linearGradient id={`${id}groove`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={rgba(shade(base, -0.65))} />
          <stop offset="1" stopColor={rgba(shade(base, 0.3))} />
        </linearGradient>
        <radialGradient id={`${id}field`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor={rgba(shade(field, 0.12))} />
          <stop offset="1" stopColor={rgba(shade(field, -0.4))} />
        </radialGradient>
        <radialGradient id={`${id}jewel`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor={rgba(shade(base, 0.35))} />
          <stop offset="1" stopColor={rgba(shade(base, -0.55))} />
        </radialGradient>
      </defs>
      <circle r="49" fill={`url(#${id}ring)`} />
      <circle r="42.5" fill={`url(#${id}groove)`} />
      <circle r="40" fill={`url(#${id}field)`} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = ((i * 45 + 22.5) * Math.PI) / 180;
        return <circle key={i} cx={45.7 * Math.cos(a)} cy={45.7 * Math.sin(a)} r="2" fill={`url(#${id}jewel)`} />;
      })}
      {/* Shadow under the star, then the faceted star itself */}
      <circle cx="1.5" cy="2.5" r="30" fill="rgba(0,0,0,0.35)" />
      <g dangerouslySetInnerHTML={{ __html: facetedStar(0, 0, 37, 15, base) + facetedStar(0, 0, 17, 9, shade(base, 0.15), 22.5) }} />
      <circle r="6.5" fill={`url(#${id}jewel)`} />
    </svg>
  );
};

export const IslamicFrame: React.FC<{ color: string }> = ({ color }) => {
  const base = hexToRgb(color);
  const light = shade(base, 0.6);
  const dark = shade(base, -0.7);
  const bed = shade(base, -0.86);
  const horizontal = bandTile(base, false);
  const vertical = bandTile(base, true);

  // A bevelled metal channel: bright rail on the lit edge, dark rail on the far one
  const bandStyle = (side: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties => {
    const across = side === 'top' || side === 'bottom';
    const position: React.CSSProperties = across
      ? { [side]: INSET, left: INSET, right: INSET, height: BAND }
      : { [side]: INSET, top: INSET + BAND, bottom: INSET + BAND, width: BAND };
    return {
      ...position,
      backgroundImage: `${across ? horizontal : vertical}, linear-gradient(${across ? '180deg' : '90deg'}, ${rgba(shade(bed, 0.12))}, ${rgba(bed)} 50%, ${rgba(shade(bed, -0.45))})`,
      backgroundRepeat: `${across ? 'repeat-x' : 'repeat-y'}, no-repeat`,
      backgroundPosition: 'center, center',
      boxShadow: across
        ? `inset 0 2px 0 ${rgba(light, 0.5)}, inset 0 -2px 0 ${rgba(dark)}`
        : `inset 2px 0 0 ${rgba(light, 0.5)}, inset -2px 0 0 ${rgba(dark)}`
    };
  };

  const corner = 76;
  const edge = 48;
  const edgeAt = Math.max(0, INSET + BAND / 2 - edge / 2);

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
      {/* The screen sits recessed inside the frame */}
      <div
        className="absolute"
        style={{
          inset: INSET + BAND,
          borderRadius: 3,
          boxShadow: `inset 0 0 0 1px ${rgba(base, 0.35)}, inset 0 10px 28px rgba(0,0,0,0.6), inset 0 0 60px ${rgba(base, 0.08)}`
        }}
      />
      {/* Outer lip and drop shadow of the whole frame */}
      <div className="absolute" style={{ inset: INSET, borderRadius: 4, boxShadow: `0 0 0 1px ${rgba(dark)}, 0 6px 18px rgba(0,0,0,0.7)` }} />
      <div className="absolute" style={bandStyle('top')} />
      <div className="absolute" style={bandStyle('bottom')} />
      <div className="absolute" style={bandStyle('left')} />
      <div className="absolute" style={bandStyle('right')} />
      <Medallion base={base} size={corner} style={{ top: 0, left: 0 }} />
      <Medallion base={base} size={corner} style={{ top: 0, right: 0 }} />
      <Medallion base={base} size={corner} style={{ bottom: 0, left: 0 }} />
      <Medallion base={base} size={corner} style={{ bottom: 0, right: 0 }} />
      <Medallion base={base} size={edge} style={{ top: edgeAt, left: `calc(50% - ${edge / 2}px)` }} />
      <Medallion base={base} size={edge} style={{ bottom: edgeAt, left: `calc(50% - ${edge / 2}px)` }} />
      <Medallion base={base} size={edge} style={{ left: edgeAt, top: `calc(50% - ${edge / 2}px)` }} />
      <Medallion base={base} size={edge} style={{ right: edgeAt, top: `calc(50% - ${edge / 2}px)` }} />
    </div>
  );
};

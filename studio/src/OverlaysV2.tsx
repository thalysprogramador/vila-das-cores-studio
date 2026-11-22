import React from "react";
import { interpolate, spring } from "remotion";
import { FONT_DISPLAY, FONT_UI, PALETTE } from "./theme";
import { Beat } from "./types";

const OUTLINE = PALETTE.outline;
const RAINBOW = PALETTE.rainbow;

export const MagicBasketV2: React.FC<{ orbs: string[]; frame: number }> = ({ orbs, frame }) => {
  const colorMap: Record<string, string> = { red: "#FF4757", yellow: "#FFD43B", blue: "#1E90FF" };
  return (
    <g transform="translate(1155, 625)">
      <ellipse cx={0} cy={46} rx={72} ry={14} fill="#22313F" opacity={0.22} />
      <path d="M -52 -6 A 52 54 0 0 1 52 -6" fill="none" stroke="#C68642" strokeWidth={10} />
      <path d="M -52 -6 A 52 54 0 0 1 52 -6" fill="none" stroke={OUTLINE} strokeWidth={3} />
      {orbs.map((col, idx) => {
        const ox = orbs.length === 1 ? 0 : orbs.length === 2 ? (idx === 0 ? -24 : 24) : (idx - 1) * 34;
        const oy = -28 + Math.sin(frame * 0.22 + idx * 1.4) * 5;
        return (
          <g key={col} transform={`translate(${ox}, ${oy})`}>
            <circle cx={0} cy={0} r={26} fill={colorMap[col] || "#FFF"} opacity={0.34} />
            <circle cx={0} cy={0} r={19} fill={colorMap[col] || "#FFF"} stroke="#FFFFFF" strokeWidth={3.2} />
            <circle cx={-6} cy={-6} r={5} fill="#FFFFFF" opacity={0.85} />
          </g>
        );
      })}
      <path d="M -66 -8 L 66 -8 L 52 44 Q 0 54 -52 44 Z" fill="#E0A463" stroke={OUTLINE} strokeWidth={3.8} strokeLinejoin="round" />
      <rect x={-72} y={-16} width={144} height={16} rx={8} fill="#F5B971" stroke={OUTLINE} strokeWidth={3.5} />
      <line x1={-50} y1={14} x2={50} y2={14} stroke="#B87A3B" strokeWidth={3} />
      <line x1={-44} y1={30} x2={44} y2={30} stroke="#B87A3B" strokeWidth={3} />
    </g>
  );
};

export const SeriesLogoV2: React.FC<{ frame: number; fps: number; isOutro?: boolean }> = ({
  frame,
  fps,
  isOutro = false,
}) => {
  const s = spring({ frame, fps, config: { damping: 11, stiffness: 90 } });
  const bounce = Math.sin(frame * 0.14) * 5;
  return (
    <g transform={`translate(640, ${132 + bounce}) scale(${s})`}>
      <rect x={-375} y={-78} width={750} height={156} rx={44} fill="#FFFFFF" stroke="#FF9F43" strokeWidth={10} />
      <rect x={-363} y={-66} width={726} height={132} rx={36} fill="#FFFDF5" stroke="#45AAF2" strokeWidth={5} />
      <text x={0} y={-6} textAnchor="middle" fontSize={60} fontWeight={800} fill="#FF4757" stroke={OUTLINE} strokeWidth={5} strokeLinejoin="round" paintOrder="stroke fill" fontFamily={FONT_DISPLAY}>
        TICO &amp; A VILA
      </text>
      <text x={0} y={48} textAnchor="middle" fontSize={50} fontWeight={800} fill="#1E90FF" stroke={OUTLINE} strokeWidth={4.5} strokeLinejoin="round" paintOrder="stroke fill" fontFamily={FONT_DISPLAY}>
        DAS CORES!
      </text>
      {isOutro && (
        <g transform="translate(0, 114)">
          <rect x={-280} y={-26} width={560} height={52} rx={26} fill="#FFD43B" stroke={OUTLINE} strokeWidth={4} />
          <text x={0} y={9} textAnchor="middle" fontSize={27} fontWeight={700} fill={OUTLINE} fontFamily={FONT_UI}>
            Até o próximo episódio, amiguinho!
          </text>
        </g>
      )}
    </g>
  );
};

export const EpisodeTitleCardV2: React.FC<{ episode: string; title: string; frame: number; fps: number }> = ({
  episode,
  title,
  frame,
  fps,
}) => {
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 85 } });
  return (
    <g transform={`translate(640, 355) scale(${s})`}>
      <rect x={-470} y={-140} width={940} height={280} rx={52} fill="#FFFFFF" stroke="#9B6BFF" strokeWidth={11} />
      <rect x={-454} y={-124} width={908} height={248} rx={42} fill="#FFFDF7" stroke="#FFD43B" strokeWidth={6} />
      <rect x={-145} y={-172} width={290} height={60} rx={30} fill="#FF4757" stroke={OUTLINE} strokeWidth={4} />
      <text x={0} y={-132} textAnchor="middle" fontSize={30} fontWeight={800} fill="#FFFFFF" fontFamily={FONT_DISPLAY}>
        {episode}
      </text>
      <text x={0} y={24} textAnchor="middle" fontSize={48} fontWeight={800} fill="#2684E6" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" paintOrder="stroke fill" fontFamily={FONT_DISPLAY}>
        {title}
      </text>
    </g>
  );
};

export const ThreeColorsPreviewV2: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const items = [
    { label: "VERMELHO", color: "#FF4757", x: 380, delay: 10 },
    { label: "AMARELO", color: "#FFD43B", x: 640, delay: 28 },
    { label: "AZUL", color: "#1E90FF", x: 900, delay: 46 },
  ];
  return (
    <g>
      {items.map((it) => {
        const s = spring({ frame: Math.max(0, frame - it.delay), fps, config: { damping: 11, stiffness: 110 } });
        return (
          <g key={it.label} transform={`translate(${it.x}, 168) scale(${s})`}>
            <circle cx={0} cy={0} r={54} fill={it.color} stroke="#FFFFFF" strokeWidth={7} />
            <circle cx={-16} cy={-16} r={14} fill="#FFFFFF" opacity={0.65} />
            <rect x={-86} y={64} width={172} height={38} rx={19} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={3} />
            <text x={0} y={90} textAnchor="middle" fontSize={22} fontWeight={800} fill={it.color} fontFamily={FONT_DISPLAY}>
              {it.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export const ColorMixMagicV2: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const mixes = [
    { c1: "#FF4757", c2: "#FFD43B", res: "#FF9F43", name: "LARANJA!", y: 118, delay: 10 },
    { c1: "#FFD43B", c2: "#1E90FF", res: "#2ED573", name: "VERDE!", y: 212, delay: 65 },
    { c1: "#1E90FF", c2: "#FF4757", res: "#9B59B6", name: "ROXO!", y: 306, delay: 120 },
  ];
  return (
    <g>
      {mixes.map((m) => {
        const s = spring({ frame: Math.max(0, frame - m.delay), fps, config: { damping: 11, stiffness: 100 } });
        if (s < 0.02) return null;
        return (
          <g key={m.name} transform={`translate(640, ${m.y}) scale(${s})`}>
            <rect x={-255} y={-38} width={510} height={76} rx={38} fill="#FFFFFF" fillOpacity={0.95} stroke={m.res} strokeWidth={6} />
            <circle cx={-190} cy={0} r={24} fill={m.c1} stroke={OUTLINE} strokeWidth={3} />
            <text x={-142} y={10} textAnchor="middle" fontSize={32} fontWeight={800} fill={OUTLINE} fontFamily={FONT_DISPLAY}>+</text>
            <circle cx={-94} cy={0} r={24} fill={m.c2} stroke={OUTLINE} strokeWidth={3} />
            <text x={-46} y={10} textAnchor="middle" fontSize={32} fontWeight={800} fill={OUTLINE} fontFamily={FONT_DISPLAY}>=</text>
            <circle cx={8} cy={0} r={27} fill={m.res} stroke={OUTLINE} strokeWidth={3.2} />
            <text x={135} y={11} textAnchor="middle" fontSize={32} fontWeight={800} fill={m.res} fontFamily={FONT_DISPLAY}>
              {m.name}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export const PopBadgeV2: React.FC<{ text: string; color: string; frame: number; fps: number }> = ({
  text,
  color,
  frame,
  fps,
}) => {
  const s = spring({ frame, fps, config: { damping: 9, stiffness: 120 } });
  const wobble = Math.sin(frame * 0.2) * 3;
  const isShort = text.length <= 3;
  return (
    <g transform={`translate(640, 128) rotate(${wobble}) scale(${s})`}>
      <rect x={isShort ? -66 : -215} y={-52} width={isShort ? 132 : 430} height={104} rx={52} fill={color} stroke="#FFFFFF" strokeWidth={8} />
      <text x={0} y={isShort ? 22 : 16} textAnchor="middle" fontSize={isShort ? 66 : 44} fontWeight={800} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={5} strokeLinejoin="round" paintOrder="stroke fill" fontFamily={FONT_DISPLAY}>
        {text}
      </text>
    </g>
  );
};

export const InteractivePromptV2: React.FC<{ text: string; frame: number; fps: number }> = ({ text, frame, fps }) => {
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const pulse = 1 + Math.sin(frame * 0.25) * 0.04;
  return (
    <g transform={`translate(640, 82) scale(${s * pulse})`}>
      <rect x={-275} y={-34} width={550} height={68} rx={34} fill="#FFD43B" stroke="#FFFFFF" strokeWidth={6} />
      <text x={0} y={11} textAnchor="middle" fontSize={30} fontWeight={700} fill={OUTLINE} fontFamily={FONT_UI}>
        {text}
      </text>
    </g>
  );
};

export const ConfettiV2: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {Array.from({ length: 34 }).map((_, i) => {
      const cx = (i * 97 + Math.sin(frame * 0.07 + i) * 45 + 1280) % 1280;
      const cy = ((frame * (4.2 + (i % 4)) + i * 67) % 820) - 50;
      const rot = (frame * (5 + (i % 5)) + i * 33) % 360;
      return (
        <rect key={i} x={-8} y={-5} width={16} height={10} rx={3} fill={RAINBOW[i % 6]} transform={`translate(${cx}, ${cy}) rotate(${rot})`} />
      );
    })}
  </g>
);

export const TransitionV2: React.FC<{ beat: Beat; beatFrame: number }> = ({ beat, beatFrame }) => {
  const p = beatFrame / Math.max(1, beat.durationFrames);
  const kind = beat.props.transition_kind || "cloud";
  const color = beat.props.transition_color || "#FFD43B";

  if (kind === "rainbow") {
    return (
      <g>
        {RAINBOW.map((c, idx) => {
          const offset = interpolate(p, [0, 1], [-1450 - idx * 90, 1450 - idx * 90]);
          return <rect key={idx} x={offset} y={idx * 120} width={1450} height={125} fill={c} />;
        })}
      </g>
    );
  }
  if (kind === "bubble") {
    return (
      <g>
        {Array.from({ length: 24 }).map((_, i) => {
          const bx = (i % 6) * 240 + 80;
          const by = interpolate(p, [0, 1], [920 + (i % 4) * 140, -260 - (i % 3) * 120]);
          const r = 95 + (i % 3) * 35;
          return (
            <g key={i} transform={`translate(${bx}, ${by})`}>
              <circle cx={0} cy={0} r={r} fill={color} fillOpacity={0.72} stroke="#FFFFFF" strokeWidth={8} />
              <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.22} fill="#FFFFFF" opacity={0.85} />
            </g>
          );
        })}
      </g>
    );
  }

  const sweepX = interpolate(p, [0, 1], [-1500, 1500]);
  return (
    <g transform={`translate(${sweepX}, 0)`}>
      <rect x={-200} y={0} width={1550} height={720} fill={color} />
      {Array.from({ length: 7 }).map((_, i) => (
        <circle key={i} cx={-200} cy={i * 120} r={115} fill="#FFFFFF" />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <circle key={i} cx={1350} cy={i * 120} r={115} fill="#FFFFFF" />
      ))}
    </g>
  );
};

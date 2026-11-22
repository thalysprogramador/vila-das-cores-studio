import React from "react";
import { PALETTE } from "../theme";
import { CharacterSvgProps, EyesV2, MouthV2 } from "./rigHelpers";

const OUTLINE = PALETTE.outline;

export const TicoV2: React.FC<CharacterSvgProps> = ({
  frame,
  emotion,
  action,
  viseme,
  blink,
  pupilDx,
  pupilDy,
  headNod,
  uid = "tico",
}) => {
  const breathe = Math.sin(frame * 0.14) * 1.6;
  const earWiggle = Math.sin(frame * 0.22) * (emotion === "excited" ? 6 : 2.5);

  const leftArmRot =
    action === "wave" || action === "celebrate"
      ? 138 + Math.sin(frame * 0.55) * 20
      : action === "clap"
      ? -36 + Math.sin(frame * 0.75) * 24
      : action === "dance"
      ? 88 + Math.sin(frame * 0.45) * 30
      : 16 + Math.sin(frame * 0.16) * 4;

  const rightArmRot =
    action === "celebrate"
      ? -138 - Math.sin(frame * 0.55) * 20
      : action === "clap"
      ? 36 - Math.sin(frame * 0.75) * 24
      : action === "dance"
      ? -88 + Math.sin(frame * 0.45) * 30
      : action === "wave"
      ? -18
      : -16 - Math.sin(frame * 0.16) * 4;

  const stepL = action === "walk_in" || action === "dance" ? Math.sin(frame * 0.55) * 10 : 0;
  const stepR = action === "walk_in" || action === "dance" ? -Math.sin(frame * 0.55) * 10 : 0;

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-fur`} cx="40%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#F0B877" />
          <stop offset="68%" stopColor="#DF9D56" />
          <stop offset="100%" stopColor="#C17D3A" />
        </radialGradient>
        <linearGradient id={`${uid}-denim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#54B5FF" />
          <stop offset="100%" stopColor="#2684E6" />
        </linearGradient>
        <radialGradient id={`${uid}-cheek`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF7597" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FF7597" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Perninhas e tênis com sola branca */}
      <g transform={`translate(-24, ${-24 + Math.min(0, stepL)})`}>
        <rect x={-16} y={-12} width={32} height={36} rx={16} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.6} />
        <ellipse cx={2} cy={22} rx={20} ry={11.5} fill="#2684E6" stroke={OUTLINE} strokeWidth={3.6} />
        <path d="M -14 25 Q 2 29 18 25" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
        <path d="M -6 17 L 6 17" stroke="#FFD43B" strokeWidth={3} strokeLinecap="round" />
      </g>
      <g transform={`translate(24, ${-24 + Math.min(0, stepR)})`}>
        <rect x={-16} y={-12} width={32} height={36} rx={16} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.6} />
        <ellipse cx={2} cy={22} rx={20} ry={11.5} fill="#2684E6" stroke={OUTLINE} strokeWidth={3.6} />
        <path d="M -14 25 Q 2 29 18 25" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
        <path d="M -6 17 L 6 17" stroke="#FFD43B" strokeWidth={3} strokeLinecap="round" />
      </g>

      {/* Corpo / Barriguinha volumétrica */}
      <g transform={`translate(0, ${breathe})`}>
        <ellipse cx={0} cy={-74} rx={57} ry={59} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={4} />
        <ellipse cx={0} cy={-79} rx={37} ry={39} fill="#FFF2D9" />
        {/* Macacão Jeans Infantil com pesponto */}
        <path
          d="M -53 -66 Q -57 -21 0 -17 Q 57 -21 53 -66 L 35 -66 L 35 -93 L -35 -93 L -35 -66 Z"
          fill={`url(#${uid}-denim)`}
          stroke={OUTLINE}
          strokeWidth={3.8}
          strokeLinejoin="round"
        />
        {/* Brilho suave superior no jeans */}
        <path d="M -29 -87 L 29 -87" stroke="#8BD2FF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        {/* Alças e botões dourados brilhantes */}
        <rect x={-35} y={-114} width={14.5} height={28} rx={6.5} fill={`url(#${uid}-denim)`} stroke={OUTLINE} strokeWidth={3.2} />
        <rect x={20.5} y={-114} width={14.5} height={28} rx={6.5} fill={`url(#${uid}-denim)`} stroke={OUTLINE} strokeWidth={3.2} />
        <circle cx={-27.5} cy={-90} r={6} fill="#FFD43B" stroke={OUTLINE} strokeWidth={2.5} />
        <circle cx={-29.5} cy={-92} r={1.8} fill="#FFFFFF" />
        <circle cx={27.5} cy={-90} r={6} fill="#FFD43B" stroke={OUTLINE} strokeWidth={2.5} />
        <circle cx={25.5} cy={-92} r={1.8} fill="#FFFFFF" />
        {/* Bolso com Estrela Dourada */}
        <path d="M -23 -74 L 23 -74 L 19 -45 Q 0 -37 -19 -45 Z" fill="#1F71CA" stroke={OUTLINE} strokeWidth={2.8} />
        <polygon
          points="0,-69 3.8,-60.5 13,-59.5 6,-53 8,-44 0,-48.8 -8,-44 -6,-53 -13,-59.5 -3.8,-60.5"
          fill="#FFD43B"
          stroke={OUTLINE}
          strokeWidth={1.9}
        />
        {/* Sombra suave do queixo sobre o peito */}
        <ellipse cx={0} cy={-112} rx={32} ry={8} fill="#9C6026" opacity={0.28} />
      </g>

      {/* Braço Esquerdo articulado */}
      <g transform={`translate(-52, ${-98 + breathe}) rotate(${leftArmRot})`}>
        <rect x={-14} y={-6} width={26} height={54} rx={13} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.6} />
        <circle cx={-1} cy={48} r={13.5} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.6} />
        <circle cx={-1} cy={49} r={6} fill="#FFCAA8" opacity={0.75} />
      </g>
      {/* Braço Direito articulado */}
      <g transform={`translate(52, ${-98 + breathe}) rotate(${rightArmRot})`}>
        <rect x={-12} y={-6} width={26} height={54} rx={13} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.6} />
        <circle cx={1} cy={48} r={13.5} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.6} />
        <circle cx={1} cy={49} r={6} fill="#FFCAA8" opacity={0.75} />
      </g>

      {/* Cabeça articulada Studio V2 */}
      <g transform={`translate(0, ${-166 + breathe * 1.1}) rotate(${headNod})`}>
        {/* Orelhinhas redondas volumétricas */}
        <g transform={`translate(-47, -45) rotate(${-earWiggle})`}>
          <circle cx={0} cy={0} r={24.5} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={4} />
          <circle cx={0} cy={2} r={13.5} fill="#FFB997" />
        </g>
        <g transform={`translate(47, -45) rotate(${earWiggle})`}>
          <circle cx={0} cy={0} r={24.5} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={4} />
          <circle cx={0} cy={2} r={13.5} fill="#FFB997" />
        </g>

        {/* Rosto redondo quente + brilho no topo da testa */}
        <ellipse cx={0} cy={0} rx={63} ry={57} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={4} />
        <ellipse cx={-16} cy={-34} rx={26} ry={11} fill="#FFF4DE" opacity={0.22} transform="rotate(-12 -16 -34)" />
        {/* Topete fofo */}
        <path d="M -9 -55 Q 0 -70 10 -54 Q 17 -65 19 -51" fill="#E8AE69" stroke={OUTLINE} strokeWidth={3.5} strokeLinecap="round" />

        {/* Focinho creme macio */}
        <ellipse cx={0} cy={17} rx={30} ry={22.5} fill="#FFF3DC" stroke="#D59550" strokeWidth={1.8} />

        {/* Bochechas rosadas suaves em gradiente */}
        <ellipse cx={-41} cy={12} rx={16} ry={10} fill={`url(#${uid}-cheek)`} opacity={action === "blow" ? 1 : 0.72} />
        <ellipse cx={41} cy={12} rx={16} ry={10} fill={`url(#${uid}-cheek)`} opacity={action === "blow" ? 1 : 0.72} />

        <EyesV2 leftX={-24} rightX={24} y={-8} blink={blink} emotion={emotion} pupilDx={pupilDx} pupilDy={pupilDy} irisColor="#693E23" />

        {/* Narizinho brilhante */}
        <ellipse cx={0} cy={5} rx={11} ry={7.8} fill="#4A2B1D" />
        <ellipse cx={-3.5} cy={2.6} rx={3.6} ry={2} fill="#FFFFFF" opacity={0.75} />

        <MouthV2 viseme={viseme} emotion={emotion} cx={0} cy={21} isBlowing={action === "blow"} />
      </g>
    </g>
  );
};

import React from "react";
import { PALETTE } from "../theme";
import { CharacterSvgProps, EyesV2, MouthV2 } from "./rigHelpers";

const OUTLINE = PALETTE.outline;

export const LiliV2: React.FC<CharacterSvgProps> = ({
  frame,
  emotion,
  action,
  viseme,
  blink,
  pupilDx,
  pupilDy,
  headNod,
  uid = "lili",
}) => {
  const breathe = Math.sin(frame * 0.15 + 1.2) * 1.5;
  const earDroop = emotion === "sad" || emotion === "thinking" ? 22 : 0;
  const earBounce = Math.sin(frame * 0.24) * (emotion === "excited" ? 8 : 3.5);

  const leftArmRot =
    action === "wave" || action === "celebrate"
      ? 138 + Math.sin(frame * 0.55) * 20
      : action === "clap"
      ? -36 + Math.sin(frame * 0.75) * 24
      : action === "dance"
      ? 85 + Math.sin(frame * 0.45 + 1) * 30
      : 16;

  const rightArmRot =
    action === "celebrate"
      ? -138 - Math.sin(frame * 0.55) * 20
      : action === "clap"
      ? 36 - Math.sin(frame * 0.75) * 24
      : action === "think"
      ? 112
      : action === "dance"
      ? -85 + Math.sin(frame * 0.45 + 1) * 30
      : -16;

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-fur`} cx="42%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="75%" stopColor="#FFF6EC" />
          <stop offset="100%" stopColor="#EEDCCD" />
        </radialGradient>
        <linearGradient id={`${uid}-dress`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF758F" />
          <stop offset="100%" stopColor="#F24368" />
        </linearGradient>
        <radialGradient id={`${uid}-cheek`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF7597" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#FF7597" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Perninhas e sapatilhas turquesa */}
      <g transform="translate(-20, -22)">
        <rect x={-12} y={-14} width={24} height={34} rx={12} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.5} />
        <ellipse cx={2} cy={20} rx={18} ry={10.5} fill="#20BF9F" stroke={OUTLINE} strokeWidth={3.5} />
        <path d="M -8 18 Q 2 22 12 18" fill="none" stroke="#A6F6E4" strokeWidth={2.6} strokeLinecap="round" />
      </g>
      <g transform="translate(20, -22)">
        <rect x={-12} y={-14} width={24} height={34} rx={12} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.5} />
        <ellipse cx={2} cy={20} rx={18} ry={10.5} fill="#20BF9F" stroke={OUTLINE} strokeWidth={3.5} />
        <path d="M -8 18 Q 2 22 12 18" fill="none" stroke="#A6F6E4" strokeWidth={2.6} strokeLinecap="round" />
      </g>

      {/* Rabinho pompom fofo */}
      <circle cx={-48} cy={-50} r={16} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={3.3} />

      {/* Vestidinho Coral com brilho + bolinhas amarelas */}
      <g transform={`translate(0, ${breathe})`}>
        <path
          d="M -32 -112 L 32 -112 L 59 -23 Q 0 -9 -59 -23 Z"
          fill={`url(#${uid}-dress)`}
          stroke={OUTLINE}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <circle cx={-20} cy={-74} r={7.5} fill="#FFE97F" />
        <circle cx={19} cy={-82} r={6.5} fill="#FFE97F" />
        <circle cx={2} cy={-50} r={8.5} fill="#FFE97F" />
        <circle cx={-33} cy={-40} r={7} fill="#FFE97F" />
        <circle cx={33} cy={-44} r={7.5} fill="#FFE97F" />
        {/* Barrinha branca delicada no vestido */}
        <path d="M -55 -27 Q 0 -15 55 -27" fill="none" stroke="#FFD6DF" strokeWidth={3.5} strokeLinecap="round" />
        {/* Gola arredondada */}
        <path d="M -27 -112 Q -13 -95 0 -106 Q 13 -95 27 -112 Z" fill="#FFFFFF" stroke={OUTLINE} strokeWidth={2.8} />
      </g>

      {/* Braços na frente do vestido */}
      <g transform={`translate(-38, ${-98 + breathe}) rotate(${leftArmRot})`}>
        <rect x={-11} y={-4} width={22} height={48} rx={11} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.5} />
        <circle cx={0} cy={44} r={11.5} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.5} />
      </g>
      <g transform={`translate(38, ${-98 + breathe}) rotate(${rightArmRot})`}>
        <rect x={-11} y={-4} width={22} height={48} rx={11} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.5} />
        <circle cx={0} cy={44} r={11.5} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={3.5} />
      </g>

      {/* Cabeça + Orelhonas */}
      <g transform={`translate(0, ${-160 + breathe * 1.1}) rotate(${headNod})`}>
        <g transform={`translate(-26, -46) rotate(${-12 - earDroop - earBounce})`}>
          <ellipse cx={0} cy={-44} rx={18.5} ry={51} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={4} />
          <ellipse cx={0} cy={-40} rx={9.5} ry={35} fill="#FFB3C6" />
        </g>
        <g transform={`translate(26, -46) rotate(${12 + earDroop + earBounce})`}>
          <ellipse cx={0} cy={-44} rx={18.5} ry={51} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={4} />
          <ellipse cx={0} cy={-40} rx={9.5} ry={35} fill="#FFB3C6" />
          {/* Lacinho turquesa brilhante */}
          <g transform="translate(8, -14) rotate(18)">
            <ellipse cx={-12} cy={0} rx={12} ry={8.5} fill="#2BCBBA" stroke={OUTLINE} strokeWidth={2.8} />
            <ellipse cx={12} cy={0} rx={12} ry={8.5} fill="#2BCBBA" stroke={OUTLINE} strokeWidth={2.8} />
            <circle cx={0} cy={0} r={6.5} fill="#FFD43B" stroke={OUTLINE} strokeWidth={2.5} />
            <circle cx={-2} cy={-2} r={2} fill="#FFFFFF" />
          </g>
        </g>

        <ellipse cx={0} cy={0} rx={59} ry={53} fill={`url(#${uid}-fur)`} stroke={OUTLINE} strokeWidth={4} />
        <ellipse cx={-38} cy={12} rx={15} ry={9.5} fill={`url(#${uid}-cheek)`} opacity={0.78} />
        <ellipse cx={38} cy={12} rx={15} ry={9.5} fill={`url(#${uid}-cheek)`} opacity={0.78} />

        <EyesV2 leftX={-22} rightX={22} y={-6} blink={blink} emotion={emotion} pupilDx={pupilDx} pupilDy={pupilDy} withLashes irisColor="#3E5C76" />

        <polygon points="-7.5,4 7.5,4 0,12.5" fill="#FF5C7A" stroke={OUTLINE} strokeWidth={2.1} strokeLinejoin="round" />

        <MouthV2 viseme={viseme} emotion={emotion} cx={0} cy={22} scale={0.96} isBlowing={action === "blow"} />
      </g>
    </g>
  );
};

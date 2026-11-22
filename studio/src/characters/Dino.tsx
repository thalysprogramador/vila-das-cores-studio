import React from "react";
import { PALETTE } from "../theme";
import { CharacterSvgProps, EyesV2, MouthV2 } from "./rigHelpers";

const OUTLINE = PALETTE.outline;

export const DinoV2: React.FC<CharacterSvgProps> = ({
  frame,
  emotion,
  action,
  viseme,
  blink,
  pupilDx,
  pupilDy,
  headNod,
  uid = "dino",
}) => {
  const breathe = Math.sin(frame * 0.18 + 2.1) * 1.8;
  const tailWag = Math.sin(frame * 0.35) * (emotion === "excited" ? 16 : 8);

  const leftArmRot =
    action === "celebrate" || action === "wave"
      ? 132 + Math.sin(frame * 0.6) * 20
      : action === "clap"
      ? -38 + Math.sin(frame * 0.75) * 25
      : action === "dance"
      ? 80 + Math.sin(frame * 0.5) * 30
      : 18;

  const rightArmRot =
    action === "celebrate"
      ? -132 - Math.sin(frame * 0.6) * 20
      : action === "clap"
      ? 38 - Math.sin(frame * 0.75) * 25
      : action === "dance"
      ? -80 + Math.sin(frame * 0.5) * 30
      : -18;

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-skin`} cx="40%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#5BE58C" />
          <stop offset="68%" stopColor="#2ECC71" />
          <stop offset="100%" stopColor="#1E9E54" />
        </radialGradient>
        <linearGradient id={`${uid}-cap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B7B" />
          <stop offset="100%" stopColor="#E8293D" />
        </linearGradient>
        <radialGradient id={`${uid}-cheek`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF7597" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#FF7597" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Rabinho abanando */}
      <g transform={`translate(-46, -42) rotate(${tailWag})`}>
        <path
          d="M 10 0 Q -36 -10 -65 -35 Q -42 19 10 19 Z"
          fill={`url(#${uid}-skin)`}
          stroke={OUTLINE}
          strokeWidth={3.8}
          strokeLinejoin="round"
        />
        <circle cx={-35} cy={-16} r={8.5} fill="#FF9F43" stroke={OUTLINE} strokeWidth={2.6} />
      </g>

      {/* Cristinhas laranjas nas costas */}
      <circle cx={-53} cy={-94} r={11.5} fill="#FF9F43" stroke={OUTLINE} strokeWidth={3} />
      <circle cx={-57} cy={-68} r={12.5} fill="#FF9F43" stroke={OUTLINE} strokeWidth={3} />

      {/* Patinhas fortes */}
      <g transform="translate(-24, -22)">
        <rect x={-18} y={-12} width={34} height={34} rx={15} fill="#23A85B" stroke={OUTLINE} strokeWidth={3.6} />
        <ellipse cx={4} cy={20} rx={21.5} ry={11.5} fill={`url(#${uid}-skin)`} stroke={OUTLINE} strokeWidth={3.6} />
        <circle cx={15} cy={22} r={3.6} fill="#FFF8DC" />
        <circle cx={21} cy={20} r={3.6} fill="#FFF8DC" />
      </g>
      <g transform="translate(26, -22)">
        <rect x={-16} y={-12} width={34} height={34} rx={15} fill="#23A85B" stroke={OUTLINE} strokeWidth={3.6} />
        <ellipse cx={4} cy={20} rx={21.5} ry={11.5} fill={`url(#${uid}-skin)`} stroke={OUTLINE} strokeWidth={3.6} />
        <circle cx={15} cy={22} r={3.6} fill="#FFF8DC" />
        <circle cx={21} cy={20} r={3.6} fill="#FFF8DC" />
      </g>

      {/* Corpo gordinho + barriguinha creme listrada */}
      <g transform={`translate(0, ${breathe})`}>
        <ellipse cx={0} cy={-74} rx={59} ry={57} fill={`url(#${uid}-skin)`} stroke={OUTLINE} strokeWidth={4} />
        <ellipse cx={6} cy={-70} rx={37} ry={41} fill="#FFF0B8" />
        <path d="M -22 -84 Q 6 -78 33 -84" fill="none" stroke="#F6B93B" strokeWidth={3.2} strokeLinecap="round" />
        <path d="M -26 -64 Q 6 -58 35 -64" fill="none" stroke="#F6B93B" strokeWidth={3.2} strokeLinecap="round" />
        <path d="M -20 -46 Q 6 -40 29 -46" fill="none" stroke="#F6B93B" strokeWidth={3.2} strokeLinecap="round" />
        <ellipse cx={4} cy={-110} rx={34} ry={7.5} fill="#187E43" opacity={0.25} />
      </g>

      {/* Bracinhos */}
      <g transform={`translate(-46, ${-88 + breathe}) rotate(${leftArmRot})`}>
        <rect x={-12} y={-4} width={24} height={42} rx={12} fill={`url(#${uid}-skin)`} stroke={OUTLINE} strokeWidth={3.5} />
      </g>
      <g transform={`translate(48, ${-88 + breathe}) rotate(${rightArmRot})`}>
        <rect x={-12} y={-4} width={24} height={42} rx={12} fill={`url(#${uid}-skin)`} stroke={OUTLINE} strokeWidth={3.5} />
      </g>

      {/* Cabeça + Boné Vermelho */}
      <g transform={`translate(4, ${-160 + breathe * 1.1}) rotate(${headNod})`}>
        <circle cx={-49} cy={-16} r={11.5} fill="#FF9F43" stroke={OUTLINE} strokeWidth={3} />
        <ellipse cx={0} cy={0} rx={65} ry={53} fill={`url(#${uid}-skin)`} stroke={OUTLINE} strokeWidth={4} />
        <circle cx={-42} cy={-10} r={6.5} fill="#23A85B" opacity={0.7} />
        <circle cx={-34} cy={22} r={5.5} fill="#23A85B" opacity={0.7} />

        <ellipse cx={-38} cy={14} rx={14.5} ry={9} fill={`url(#${uid}-cheek)`} />
        <ellipse cx={42} cy={14} rx={14.5} ry={9} fill={`url(#${uid}-cheek)`} />

        <EyesV2 leftX={-20} rightX={24} y={-8} blink={blink} emotion={emotion} pupilDx={pupilDx} pupilDy={pupilDy} irisColor="#2D6A4F" />

        <circle cx={-5} cy={7} r={3.2} fill="#187E43" />
        <circle cx={9} cy={7} r={3.2} fill="#187E43" />

        <MouthV2 viseme={viseme} emotion={emotion} cx={2} cy={24} scale={1.08} isBlowing={action === "blow"} />

        {/* Boné Vermelho com brilho */}
        <g transform="translate(0, -40) rotate(-6)">
          <path d="M -47 6 Q -45 -37 0 -37 Q 45 -37 47 6 Z" fill={`url(#${uid}-cap)`} stroke={OUTLINE} strokeWidth={3.8} />
          <path d="M -22 -24 Q -6 -32 10 -26" fill="none" stroke="#FF9AA5" strokeWidth={4.5} strokeLinecap="round" opacity={0.7} />
          <path d="M 10 4 Q 58 -2 74 10 Q 54 19 8 12 Z" fill="#D92033" stroke={OUTLINE} strokeWidth={3.5} />
          <circle cx={0} cy={-39} r={7.5} fill="#FFD43B" stroke={OUTLINE} strokeWidth={2.8} />
          <circle cx={-2} cy={-41} r={2.2} fill="#FFFFFF" />
        </g>
      </g>
    </g>
  );
};

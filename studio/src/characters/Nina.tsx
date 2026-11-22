import React from "react";
import { PALETTE } from "../theme";
import { CharacterSvgProps, EyesV2 } from "./rigHelpers";

const OUTLINE = PALETTE.outline;

export const NinaV2: React.FC<CharacterSvgProps> = ({
  frame,
  emotion,
  viseme,
  blink,
  pupilDx,
  pupilDy,
  headNod,
  uid = "nina",
}) => {
  const hover = Math.sin(frame * 0.16) * 10;
  const wingFlap = Math.sin(frame * 0.36) * 24;
  const beakOpen = viseme === 0 ? 0 : viseme === 1 ? 3 : viseme === 2 ? 6 : viseme === 5 ? 9 : 12;

  return (
    <g transform={`translate(0, ${hover})`}>
      <defs>
        <radialGradient id={`${uid}-plumage`} cx="42%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#BA8BFF" />
          <stop offset="68%" stopColor="#9B6BFF" />
          <stop offset="100%" stopColor="#7744D9" />
        </radialGradient>
        <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9B6BFF" />
          <stop offset="100%" stopColor="#6D3BC9" />
        </linearGradient>
      </defs>

      {/* Asinhas articuladas em camadas */}
      <g transform={`translate(-54, -78) rotate(${-18 + wingFlap})`}>
        <ellipse cx={-22} cy={14} rx={37} ry={22.5} fill={`url(#${uid}-wing)`} stroke={OUTLINE} strokeWidth={3.8} />
        <ellipse cx={-24} cy={16} rx={22} ry={12} fill="#BA8BFF" opacity={0.8} />
      </g>
      <g transform={`translate(54, -78) rotate(${18 - wingFlap})`}>
        <ellipse cx={22} cy={14} rx={37} ry={22.5} fill={`url(#${uid}-wing)`} stroke={OUTLINE} strokeWidth={3.8} />
        <ellipse cx={24} cy={16} rx={22} ry={12} fill="#BA8BFF" opacity={0.8} />
      </g>

      {/* Patinhas laranjas */}
      <path d="M -20 -18 L -28 -2 M -20 -18 L -20 0 M -20 -18 L -12 -2" stroke="#FA8231" strokeWidth={5.8} strokeLinecap="round" />
      <path d="M 20 -18 L 12 -2 M 20 -18 L 20 0 M 20 -18 L 28 -2" stroke="#FA8231" strokeWidth={5.8} strokeLinecap="round" />

      <g transform={`rotate(${headNod * 0.6})`}>
        <polygon points="-46,-132 -59,-166 -24,-146" fill="#7D49DF" stroke={OUTLINE} strokeWidth={3.8} strokeLinejoin="round" />
        <polygon points="46,-132 59,-166 24,-146" fill="#7D49DF" stroke={OUTLINE} strokeWidth={3.8} strokeLinejoin="round" />

        <ellipse cx={0} cy={-86} rx={65} ry={71} fill={`url(#${uid}-plumage)`} stroke={OUTLINE} strokeWidth={4} />
        {/* Brilho macio no topo */}
        <ellipse cx={-12} cy={-136} rx={22} ry={8} fill="#FFFFFF" opacity={0.22} />

        {/* Barriguinha creme */}
        <ellipse cx={0} cy={-58} rx={43} ry={37} fill="#FDF5FF" />
        <path d="M -21 -64 Q -12 -55 -4 -64 M 4 -64 Q 12 -55 21 -64 M -12 -46 Q 0 -37 12 -46" fill="none" stroke="#C59BFF" strokeWidth={3.3} strokeLinecap="round" />

        {/* Discos faciais */}
        <circle cx={-24} cy={-108} r={24.5} fill="#F7ECFF" />
        <circle cx={24} cy={-108} r={24.5} fill="#F7ECFF" />

        <EyesV2 leftX={-24} rightX={24} y={-108} blink={blink} emotion={emotion} pupilDx={pupilDx} pupilDy={pupilDy} size={0.95} withLashes irisColor="#5B3A7D" />

        {/* Óculos redondos dourados com reflexo nas lentes */}
        <circle cx={-24} cy={-108} r={21.5} fill="#FFFFFF" fillOpacity={0.12} stroke="#F7B731" strokeWidth={4.5} />
        <circle cx={24} cy={-108} r={21.5} fill="#FFFFFF" fillOpacity={0.12} stroke="#F7B731" strokeWidth={4.5} />
        <line x1={-2.5} y1={-108} x2={2.5} y2={-108} stroke="#F7B731" strokeWidth={4.5} />

        {/* Bico sincronizado 6-visemas */}
        <g transform="translate(0, -88)">
          <polygon points={`-12.5,-4 12.5,-4 0,${8 + beakOpen * 0.25}`} fill="#FA8231" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
          {beakOpen > 0 && (
            <polygon points={`-9.5,2 9.5,2 0,${8 + beakOpen}`} fill="#872038" stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
          )}
        </g>
      </g>
    </g>
  );
};

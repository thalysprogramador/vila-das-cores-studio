import React from "react";
import { PALETTE } from "../theme";
import { Emotion } from "../types";

const OUTLINE = PALETTE.outline;

export interface CharacterSvgProps {
  frame: number;
  emotion: Emotion;
  action: string;
  viseme: number; // 0..5 (6 visemas fonéticos V2!)
  blink: boolean;
  pupilDx: number;
  pupilDy: number;
  headNod: number;
  uid?: string;
}

export function isBlinking(globalFrame: number, seed: number): boolean {
  const period = 84 + (seed % 23);
  const f = (globalFrame + seed * 19) % period;
  return f >= period - 3;
}

/** Olhos Studio V2 — com profundidade de íris, brilho duplo cristalino e sobrancelhas ricas */
export const EyesV2: React.FC<{
  leftX: number;
  rightX: number;
  y: number;
  blink: boolean;
  emotion: Emotion;
  pupilDx: number;
  pupilDy: number;
  size?: number;
  withLashes?: boolean;
  irisColor?: string;
}> = ({
  leftX,
  rightX,
  y,
  blink,
  emotion,
  pupilDx,
  pupilDy,
  size = 1,
  withLashes = false,
  irisColor = "#5B3826",
}) => {
  const r = 12.2 * size;

  if (blink || emotion === "laughing") {
    return (
      <g>
        {[leftX, rightX].map((ex, i) => (
          <path
            key={i}
            d={`M ${ex - 11 * size} ${y + 2} Q ${ex} ${y - 10 * size} ${ex + 11 * size} ${y + 2}`}
            fill="none"
            stroke={OUTLINE}
            strokeWidth={3.8 * size}
            strokeLinecap="round"
          />
        ))}
      </g>
    );
  }

  const eyeScaleY = emotion === "surprised" ? 1.18 : 1.0;

  return (
    <g>
      {[leftX, rightX].map((ex, i) => (
        <g key={i}>
          {withLashes && (
            <>
              <path
                d={`M ${ex + (i === 0 ? -r + 1 : r - 1)} ${y - 5 * size} Q ${ex + (i === 0 ? -r - 6 * size : r + 6 * size)} ${y - 9 * size} ${ex + (i === 0 ? -r - 8 * size : r + 8 * size)} ${y - 12 * size}`}
                fill="none"
                stroke={OUTLINE}
                strokeWidth={2.7 * size}
                strokeLinecap="round"
              />
              <path
                d={`M ${ex + (i === 0 ? -r + 4 : r - 4)} ${y - 10 * size} Q ${ex + (i === 0 ? -r - 2 * size : r + 2 * size)} ${y - 15 * size} ${ex + (i === 0 ? -r - 4 * size : r + 4 * size)} ${y - 17 * size}`}
                fill="none"
                stroke={OUTLINE}
                strokeWidth={2.4 * size}
                strokeLinecap="round"
              />
            </>
          )}
          {/* Esclera com leve sombra superior (profundidade 3D suave) */}
          <ellipse
            cx={ex}
            cy={y}
            rx={r}
            ry={r * 1.14 * eyeScaleY}
            fill="#FFFFFF"
            stroke={OUTLINE}
            strokeWidth={3.1 * size}
          />
          {/* Sombra superior delicada estritamente DENTRO da esclera */}
          <path
            d={`M ${ex - r * 0.62} ${y - r * 0.56} Q ${ex} ${y - r * 0.92} ${ex + r * 0.62} ${y - r * 0.56}`}
            fill="none"
            stroke="#DFEDF7"
            strokeWidth={2.2 * size}
            strokeLinecap="round"
          />
          {/* Íris quente + pupila escura */}
          <circle cx={ex + pupilDx} cy={y + pupilDy} r={r * 0.65} fill={irisColor} />
          <circle cx={ex + pupilDx} cy={y + pupilDy + 1.2 * size} r={r * 0.44} fill="#1E130F" />
          {/* Brilhos duplos estilo animação moderna */}
          <circle cx={ex + pupilDx - 3.6 * size} cy={y + pupilDy - 4.0 * size} r={3.6 * size} fill="#FFFFFF" />
          <circle cx={ex + pupilDx + 3.0 * size} cy={y + pupilDy + 3.0 * size} r={1.6 * size} fill="#FFFFFF" opacity={0.9} />
        </g>
      ))}
      {/* Sobrancelhas expressivas */}
      {(() => {
        const browY = y - r * 1.48;
        if (emotion === "surprised" || emotion === "excited") {
          return (
            <>
              <path d={`M ${leftX - 10} ${browY - 3} Q ${leftX} ${browY - 11} ${leftX + 10} ${browY - 3}`} fill="none" stroke={OUTLINE} strokeWidth={3.2} strokeLinecap="round" />
              <path d={`M ${rightX - 10} ${browY - 3} Q ${rightX} ${browY - 11} ${rightX + 10} ${browY - 3}`} fill="none" stroke={OUTLINE} strokeWidth={3.2} strokeLinecap="round" />
            </>
          );
        }
        if (emotion === "sad") {
          return (
            <>
              <path d={`M ${leftX - 10} ${browY + 3} Q ${leftX} ${browY - 3} ${leftX + 9} ${browY - 5}`} fill="none" stroke={OUTLINE} strokeWidth={3.2} strokeLinecap="round" />
              <path d={`M ${rightX - 9} ${browY - 5} Q ${rightX} ${browY - 3} ${rightX + 10} ${browY + 3}`} fill="none" stroke={OUTLINE} strokeWidth={3.2} strokeLinecap="round" />
            </>
          );
        }
        if (emotion === "curious" || emotion === "thinking") {
          return (
            <>
              <path d={`M ${leftX - 10} ${browY} Q ${leftX} ${browY - 4} ${leftX + 10} ${browY}`} fill="none" stroke={OUTLINE} strokeWidth={3.2} strokeLinecap="round" />
              <path d={`M ${rightX - 10} ${browY - 4} Q ${rightX} ${browY - 10} ${rightX + 10} ${browY - 4}`} fill="none" stroke={OUTLINE} strokeWidth={3.2} strokeLinecap="round" />
            </>
          );
        }
        // Sobrancelha feliz suave
        return (
          <>
            <path d={`M ${leftX - 9} ${browY} Q ${leftX} ${browY - 5} ${leftX + 9} ${browY}`} fill="none" stroke={OUTLINE} strokeWidth={2.7} strokeLinecap="round" opacity={0.75} />
            <path d={`M ${rightX - 9} ${browY} Q ${rightX} ${browY - 5} ${rightX + 9} ${browY}`} fill="none" stroke={OUTLINE} strokeWidth={2.7} strokeLinecap="round" opacity={0.75} />
          </>
        );
      })()}
    </g>
  );
};

/** Boca Studio V2 com 6 visemas fonéticos (0..5) + dentes brilhantes e língua macia */
export const MouthV2: React.FC<{
  viseme: number;
  emotion: Emotion;
  cx: number;
  cy: number;
  scale?: number;
  isBlowing?: boolean;
}> = ({ viseme, emotion, cx, cy, scale = 1, isBlowing = false }) => {
  if (isBlowing) {
    return (
      <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
        <circle cx={0} cy={2} r={8.5} fill="#872038" stroke={OUTLINE} strokeWidth={3} />
        <circle cx={2.5} cy={-0.5} r={2.8} fill="#FF8DA1" opacity={0.75} />
      </g>
    );
  }

  if (viseme === 0) {
    if (emotion === "surprised") {
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
          <ellipse cx={0} cy={3} rx={8.5} ry={10.5} fill="#872038" stroke={OUTLINE} strokeWidth={3} />
          <ellipse cx={0} cy={8.5} rx={4.5} ry={3} fill="#FF7B93" />
        </g>
      );
    }
    if (emotion === "sad") {
      return (
        <path
          d={`M ${cx - 12 * scale} ${cy + 6 * scale} Q ${cx} ${cy - 4 * scale} ${cx + 12 * scale} ${cy + 6 * scale}`}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={3.3 * scale}
          strokeLinecap="round"
        />
      );
    }
    if (emotion === "thinking" || emotion === "curious") {
      return (
        <path
          d={`M ${cx - 10 * scale} ${cy + 2 * scale} Q ${cx + 2 * scale} ${cy + 6 * scale} ${cx + 12 * scale} ${cy - 1 * scale}`}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={3.3 * scale}
          strokeLinecap="round"
        />
      );
    }
    if (emotion === "laughing" || emotion === "excited") {
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
          <path d="M -17 -2 Q 0 19 17 -2 Z" fill="#872038" stroke={OUTLINE} strokeWidth={3.1} strokeLinejoin="round" />
          <path d="M -11 -1.5 L 11 -1.5 L 9.5 2.5 L -9.5 2.5 Z" fill="#FFFFFF" />
          <ellipse cx={0} cy={8} rx={8.5} ry={4.6} fill="#FF7B93" />
        </g>
      );
    }
    return (
      <path
        d={`M ${cx - 14.5 * scale} ${cy - 1 * scale} Q ${cx} ${cy + 12.5 * scale} ${cx + 14.5 * scale} ${cy - 1 * scale}`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={3.4 * scale}
        strokeLinecap="round"
      />
    );
  }

  // Viseme 1: M/B/P suave
  if (viseme === 1) {
    return (
      <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
        <ellipse cx={0} cy={2} rx={11} ry={3.8} fill="#872038" stroke={OUTLINE} strokeWidth={2.9} />
      </g>
    );
  }
  // Viseme 2: E/I estreito sorridente
  if (viseme === 2) {
    return (
      <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
        <ellipse cx={0} cy={2} rx={15} ry={6.5} fill="#872038" stroke={OUTLINE} strokeWidth={3} />
        <rect x={-10} y={-2.5} width={20} height={3.5} rx={1.5} fill="#FFFFFF" />
        <ellipse cx={0} cy={5.5} rx={7} ry={2.5} fill="#FF7B93" />
      </g>
    );
  }
  // Viseme 3: A/É aberto médio
  if (viseme === 3) {
    return (
      <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
        <path d="M -16 -3 Q 0 -1 16 -3 Q 15 15 0 16 Q -15 15 -16 -3 Z" fill="#872038" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
        <rect x={-10} y={-2.5} width={20} height={3.8} rx={1.5} fill="#FFFFFF" />
        <ellipse cx={0} cy={10} rx={8.5} ry={4.5} fill="#FF7B93" />
      </g>
    );
  }
  // Viseme 5: O/U arredondado
  if (viseme === 5) {
    return (
      <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
        <ellipse cx={0} cy={4} rx={10.5} ry={11.5} fill="#872038" stroke={OUTLINE} strokeWidth={3} />
        <ellipse cx={0} cy={10} rx={6} ry={4} fill="#FF7B93" />
      </g>
    );
  }
  // Viseme 4: Bem aberto expressivo!
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
      <ellipse cx={0} cy={5} rx={15.5} ry={14.5} fill="#872038" stroke={OUTLINE} strokeWidth={3.1} />
      <path d="M -10 -3 Q 0 -6 10 -3 L 10 0.5 L -10 0.5 Z" fill="#FFFFFF" />
      <ellipse cx={0} cy={12.5} rx={9.5} ry={5.8} fill="#FF7B93" />
    </g>
  );
};

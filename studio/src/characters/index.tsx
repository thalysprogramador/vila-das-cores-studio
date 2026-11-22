import React from "react";
import { interpolate, spring } from "remotion";
import { CharState } from "../types";
import { DinoV2 } from "./Dino";
import { LiliV2 } from "./Lili";
import { NinaV2 } from "./Nina";
import { CharacterSvgProps, isBlinking } from "./rigHelpers";
import { TicoV2 } from "./Tico";

/**
 * REGISTRO MODULAR DE PERSONAGENS:
 * Para adicionar um novo personagem no futuro (ex.: Pipoca no Ep. 2),
 * crie "characters/Pipoca.tsx" e adicione 1 linha neste objeto!
 */
export const CHARACTER_REGISTRY: Record<string, React.FC<CharacterSvgProps>> = {
  tico: TicoV2,
  lili: LiliV2,
  dino: DinoV2,
  nina: NinaV2,
};

const CHAR_SEEDS: Record<string, number> = { tico: 3, lili: 11, dino: 19, nina: 29 };

interface CharacterRigV2Props {
  char: CharState;
  prevX?: number;
  prevY?: number;
  globalFrame: number;
  beatFrame: number;
  fps: number;
  isSpeaking: boolean;
  mouthViseme: number;
  lookTargetX?: number;
  scale?: number;
  uidPrefix?: string;
}

export const CharacterRigV2: React.FC<CharacterRigV2Props> = ({
  char,
  prevX,
  prevY,
  globalFrame,
  beatFrame,
  fps,
  isSpeaking,
  mouthViseme,
  lookTargetX,
  scale = 1,
  uidPrefix = "ep",
}) => {
  const Component = CHARACTER_REGISTRY[char.id] || TicoV2;
  const seed = CHAR_SEEDS[char.id] ?? 7;
  const blink = isBlinking(globalFrame, seed);

  // Deslizamento suave com passinhos se o personagem mudou de posição entre dois beats!
  let glideX = 0;
  let glideY = 0;
  let walkHop = 0;
  if (prevX !== undefined && (Math.abs(prevX - char.x) > 4 || (prevY !== undefined && Math.abs(prevY - char.y) > 4))) {
    const gp = spring({ frame: beatFrame, fps, config: { damping: 18, stiffness: 85 } });
    glideX = interpolate(gp, [0, 1], [prevX - char.x, 0]);
    glideY = prevY !== undefined ? interpolate(gp, [0, 1], [prevY - char.y, 0]) : 0;
    walkHop = -Math.abs(Math.sin(beatFrame * 0.55)) * 11 * Math.max(0, 1 - gp);
  }

  let dx = glideX;
  let dy = glideY + walkHop;
  let rot = 0;
  let sx = 1;
  let sy = 1;

  if (char.action === "walk_in") {
    const prog = spring({ frame: beatFrame, fps, config: { damping: 16, stiffness: 80 } });
    dx = interpolate(prog, [0, 1], [char.facing === "left" ? 260 : -260, 0]);
    dy = -Math.abs(Math.sin(beatFrame * 0.5)) * 12 * (1 - prog);
  } else if (char.action === "fly_in") {
    const prog = spring({ frame: beatFrame, fps, config: { damping: 14, stiffness: 70 } });
    dx = interpolate(prog, [0, 1], [240, 0]);
    dy = interpolate(prog, [0, 1], [-180, 0]);
  } else if (char.action === "jump" || char.action === "celebrate") {
    const h = Math.sin((globalFrame * 0.28 + seed) % Math.PI);
    dy = -h * 34;
    sy = 1 + (h - 0.3) * 0.08;
    sx = 1 - (h - 0.3) * 0.06;
  } else if (char.action === "bounce") {
    const h = Math.abs(Math.sin(globalFrame * 0.25 + seed));
    dy = -h * 16;
    sy = 1 + h * 0.05;
    sx = 1 - h * 0.04;
  } else if (char.action === "dance") {
    const groove = Math.sin(globalFrame * 0.32 + seed);
    dy = -Math.abs(groove) * 18;
    rot = groove * 7;
  } else if (char.action === "trip" && beatFrame < 48) {
    const p = beatFrame / 48;
    dy = -Math.sin(p * Math.PI) * 45;
    rot = Math.sin(p * Math.PI * 2) * 24;
  }

  const talkEnergy = isSpeaking && mouthViseme > 0 ? Math.min(3, mouthViseme) : 0;
  // Aceno natural de cabeça de quem está ouvindo + ritmo vivo de quem está falando!
  const listenNod = !isSpeaking ? Math.sin(globalFrame * 0.12 + seed * 1.7) * 3.2 : 0;
  const headNod =
    talkEnergy > 0
      ? Math.sin(globalFrame * 0.52) * (2.8 + talkEnergy * 1.3)
      : char.action === "look_up"
      ? -10
      : listenNod;

  if (talkEnergy > 0 && char.id !== "nina") {
    sy *= 1 + talkEnergy * 0.016;
    sx *= 1 - talkEnergy * 0.010;
    rot += Math.sin(globalFrame * 0.36) * 1.8;
  }

  const facingSign = char.facing === "left" ? -1 : 1;
  let pupilDx = 0;
  let pupilDy = char.action === "look_up" ? -4.5 : 0;
  if (lookTargetX !== undefined && Math.abs(lookTargetX - char.x) > 40) {
    pupilDx = (lookTargetX > char.x ? 1 : -1) * facingSign * 3.2;
  }

  const shadowScale = Math.max(0.55, 1 + dy / 140);

  return (
    <g transform={`translate(${char.x + dx}, ${char.y}) scale(${scale})`}>
      <ellipse
        cx={0}
        cy={char.id === "nina" ? 155 : 4}
        rx={(char.id === "nina" ? 42 : 58) * shadowScale}
        ry={(char.id === "nina" ? 10 : 14) * shadowScale}
        fill="#22313F"
        opacity={char.id === "nina" ? 0.14 : 0.22}
      />
      {char.action === "clap" && Math.sin(globalFrame * 0.75) > 0.6 && (
        <g transform="translate(0, -100)">
          <line x1={-16} y1={-18} x2={-26} y2={-28} stroke="#FFD43B" strokeWidth={4} strokeLinecap="round" />
          <line x1={0} y1={-22} x2={0} y2={-36} stroke="#FF4D6D" strokeWidth={4} strokeLinecap="round" />
          <line x1={16} y1={-18} x2={26} y2={-28} stroke="#FFD43B" strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      {char.action === "blow" && (
        <g transform={`translate(${facingSign * 62}, -145) scale(${facingSign}, 1)`} opacity={0.78}>
          <path
            d={`M 0 0 Q ${35 + (globalFrame % 16) * 2} -14 ${75 + (globalFrame % 16) * 3} -4`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d={`M 8 14 Q ${45 + ((globalFrame + 6) % 16) * 2} 10 ${88 + ((globalFrame + 6) % 16) * 3} 18`}
            fill="none"
            stroke="#DFF9FB"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </g>
      )}
      <g transform={`translate(0, ${dy}) rotate(${rot}) scale(${facingSign * sx}, ${sy})`}>
        <Component
          frame={globalFrame}
          emotion={char.emotion}
          action={char.action}
          viseme={mouthViseme}
          blink={blink}
          pupilDx={pupilDx}
          pupilDy={pupilDy}
          headNod={headNod}
          uid={`${uidPrefix}-${char.id}`}
        />
      </g>
    </g>
  );
};

export { DinoV2, LiliV2, NinaV2, TicoV2 };

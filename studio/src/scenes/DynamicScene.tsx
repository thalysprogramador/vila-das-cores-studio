import React from "react";
import { PALETTE } from "../theme";
import { CustomSceneAsset, PropsState } from "../types";
import { SceneBackgroundV2 } from "./BackgroundsV2";

const RAINBOW = PALETTE.rainbow;
const OUTLINE = PALETTE.outline;

interface DynamicSceneProps {
  scene: string;
  customScene?: CustomSceneAsset;
  globalFrame: number;
  beatFrame: number;
  fps: number;
  props: PropsState;
  cameraX?: number;
}

/** Partículas 24fps vivas sobre qualquer cenário gerado pelo Diretor de Arte IA! */
const LivingAtmosphere: React.FC<{ fx: string; skyMood: string; frame: number; cameraX: number }> = ({
  fx,
  skyMood,
  frame,
  cameraX,
}) => {
  const pxSlow = cameraX * 0.14;

  return (
    <g>
      {/* Nuvens suaves passando devagar em cenas diurnas/pôr do sol */}
      {(skyMood === "day" || skyMood === "sunset") && (
        <g opacity={0.55}>
          {[0, 1].map((i) => {
            const cx = ((frame * (0.48 + i * 0.16) + i * 680) % 1540) - 130 + pxSlow;
            const cy = 88 + i * 54;
            return (
              <g key={i} transform={`translate(${cx}, ${cy}) scale(${0.82 + i * 0.1})`}>
                <ellipse cx={0} cy={12} rx={56} ry={19} fill="#FFFFFF" />
                <circle cx={-28} cy={4} r={22} fill="#FFFFFF" />
                <circle cx={0} cy={-8} r={29} fill="#FFFFFF" />
                <circle cx={30} cy={4} r={20} fill="#FFFFFF" />
              </g>
            );
          })}
        </g>
      )}

      {/* Estrelinhas piscando em cenas de noite/espaço */}
      {(skyMood === "night" || skyMood === "space") &&
        Array.from({ length: 20 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 127 + 40) % 1220}
            cy={35 + ((i * 71) % 310)}
            r={2.4 + (i % 3) * 1.4}
            fill="#FFF7AE"
            opacity={0.3 + Math.abs(Math.sin(frame * 0.12 + i)) * 0.7}
          />
        ))}

      {/* Notas musicais coloridas dançando no ar! */}
      {fx === "musical_notes" &&
        Array.from({ length: 12 }).map((_, i) => {
          const nx = 90 + ((i * 111 + frame * 1.2) % 1120);
          const ny = 480 - ((frame * (2.2 + (i % 3) * 0.6) + i * 75) % 440);
          const wob = Math.sin(frame * 0.16 + i) * 12;
          const col = RAINBOW[i % 6];
          return (
            <g key={i} transform={`translate(${nx}, ${ny}) rotate(${wob})`} opacity={0.9}>
              <ellipse cx={-6} cy={12} rx={9} ry={6.5} fill={col} stroke={OUTLINE} strokeWidth={2.2} transform="rotate(-18 -6 12)" />
              <path d="M 1 10 L 1 -16 L 16 -20 L 16 4" fill="none" stroke={OUTLINE} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 1 10 L 1 -16 L 16 -20" fill="none" stroke={col} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}

      {/* Chuvinha colorida fofa de arco-íris */}
      {fx === "rain_rainbow" &&
        Array.from({ length: 24 }).map((_, i) => {
          const rx = (i * 89 + frame * 1.1) % 1280;
          const ry = ((frame * (7.5 + (i % 4) * 1.5) + i * 67) % 760) - 20;
          return (
            <ellipse
              key={i}
              cx={rx}
              cy={ry}
              rx={3.5}
              ry={11}
              fill={RAINBOW[i % 6]}
              opacity={0.72}
              transform={`rotate(10 ${rx} ${ry})`}
            />
          );
        })}

      {/* Flocos de neve caindo suavemente */}
      {fx === "snow" &&
        Array.from({ length: 26 }).map((_, i) => {
          const sx = (i * 97 + Math.sin(frame * 0.06 + i) * 35 + 1280) % 1280;
          const sy = ((frame * (2.4 + (i % 3) * 0.8) + i * 59) % 760) - 20;
          return <circle key={i} cx={sx} cy={sy} r={4 + (i % 3) * 2.2} fill="#FFFFFF" opacity={0.85} />;
        })}

      {/* Bolhas subindo */}
      {fx === "bubbles" &&
        Array.from({ length: 14 }).map((_, i) => {
          const bx = 120 + ((i * 93) % 1080) + Math.sin(frame * 0.08 + i) * 22;
          const by = 680 - ((frame * (2.0 + (i % 3) * 0.7) + i * 90) % 660);
          const r = 10 + (i % 4) * 5;
          return (
            <g key={i} transform={`translate(${bx}, ${by})`} opacity={0.72}>
              <circle cx={0} cy={0} r={r} fill="#DFF9FB" fillOpacity={0.3} stroke="#FFFFFF" strokeWidth={2.5} />
              <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.25} fill="#FFFFFF" />
            </g>
          );
        })}

      {/* Pétalas dançando */}
      {fx === "petals" &&
        Array.from({ length: 16 }).map((_, i) => {
          const px = (i * 107 + frame * 1.6 + Math.sin(frame * 0.08 + i) * 30) % 1300;
          const py = ((frame * (2.1 + (i % 3) * 0.5) + i * 71) % 740) - 20;
          const rot = (frame * 3 + i * 40) % 360;
          return (
            <ellipse
              key={i}
              cx={0}
              cy={0}
              rx={9}
              ry={5}
              fill={i % 2 === 0 ? "#FF9FF3" : "#FFEAA7"}
              opacity={0.82}
              transform={`translate(${px}, ${py}) rotate(${rot})`}
            />
          );
        })}

      {/* Vaga-lumes ou estrelinhas brilhantes */}
      {(fx === "fireflies" || fx === "sparkles" || fx === "stars") &&
        Array.from({ length: 14 }).map((_, i) => {
          const gx = 80 + ((i * 103 + frame * 0.8) % 1140);
          const gy = 110 + (i % 5) * 95 + Math.sin(frame * 0.14 + i) * 20;
          const op = 0.35 + Math.abs(Math.sin(frame * 0.18 + i)) * 0.65;
          return <circle key={i} cx={gx} cy={gy} r={4 + (i % 3) * 1.8} fill="#FFF7AE" opacity={op} />;
        })}

      {/* Coraçõezinhos alegres */}
      {fx === "hearts" &&
        Array.from({ length: 10 }).map((_, i) => {
          const hx = 140 + ((i * 119) % 1020) + Math.sin(frame * 0.1 + i) * 18;
          const hy = 560 - ((frame * 2.0 + i * 85) % 520);
          return (
            <path
              key={i}
              d="M 0 6 C -10 -4 -14 8 0 18 C 14 8 10 -4 0 6 Z"
              fill={i % 2 === 0 ? "#FF6B81" : "#FF9FF3"}
              opacity={0.78}
              transform={`translate(${hx}, ${hy}) scale(0.9)`}
            />
          );
        })}
    </g>
  );
};

export const DynamicScene: React.FC<DynamicSceneProps> = ({
  scene,
  customScene,
  globalFrame,
  beatFrame,
  fps,
  props,
  cameraX = 0,
}) => {
  // Se o Diretor de Arte IA gerou um cenário vetorial exclusivo para este Ato, usa ele + vida em 24fps!
  if (customScene && customScene.svg_inner) {
    return (
      <g>
        <g dangerouslySetInnerHTML={{ __html: customScene.svg_inner }} />
        <LivingAtmosphere
          fx={customScene.fx || "sparkles"}
          skyMood={customScene.sky_mood || "day"}
          frame={globalFrame}
          cameraX={cameraX}
        />
      </g>
    );
  }

  // Fallback limpo para cenários clássicos (ex.: intro_stage, title_card, outro_stage, Ep. 1)
  return (
    <SceneBackgroundV2
      scene={scene}
      globalFrame={globalFrame}
      beatFrame={beatFrame}
      fps={fps}
      props={props}
      cameraX={cameraX}
    />
  );
};

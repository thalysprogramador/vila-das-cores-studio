import React from "react";
import { interpolate, spring } from "remotion";
import { FONT_DISPLAY, PALETTE } from "../theme";
import { PropsState } from "../types";

const OUTLINE = PALETTE.outline;
const RAINBOW = PALETTE.rainbow;

interface SceneBackgroundV2Props {
  scene: string;
  globalFrame: number;
  beatFrame: number;
  fps: number;
  props: PropsState;
  cameraX?: number;
}

const CloudV2: React.FC<{ x: number; y: number; scale?: number; opacity?: number }> = ({
  x,
  y,
  scale = 1,
  opacity = 0.95,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
    <ellipse cx={0} cy={17} rx={62} ry={21} fill="#D9F1FF" />
    <ellipse cx={0} cy={12} rx={60} ry={22} fill="#FFFFFF" />
    <circle cx={-32} cy={4} r={25} fill="#FFFFFF" />
    <circle cx={0} cy={-9} r={33} fill="#FFFFFF" />
    <circle cx={34} cy={4} r={23} fill="#FFFFFF" />
  </g>
);

const SunV2: React.FC<{ x: number; y: number; frame: number; scale?: number; glow?: boolean }> = ({
  x,
  y,
  frame,
  scale = 1,
  glow = false,
}) => {
  const rot = (frame * 0.55) % 360;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {glow && <circle cx={0} cy={0} r={102 + Math.sin(frame * 0.14) * 8} fill="#FFF2A6" opacity={0.38} />}
      <g transform={`rotate(${rot})`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={-6} y={-76} width={12} height={22} rx={6} fill="#FFD43B" transform={`rotate(${i * 30})`} />
        ))}
      </g>
      <circle cx={0} cy={0} r={48} fill="#FFE047" stroke="#F7B731" strokeWidth={4} />
      <circle cx={-14} cy={-6} r={4.5} fill={OUTLINE} />
      <circle cx={14} cy={-6} r={4.5} fill={OUTLINE} />
      <ellipse cx={-24} cy={4} rx={7} ry={4.5} fill="#FF9F43" opacity={0.6} />
      <ellipse cx={24} cy={4} rx={7} ry={4.5} fill="#FF9F43" opacity={0.6} />
      <path d="M -14 8 Q 0 22 14 8" fill="none" stroke={OUTLINE} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
};

const RainbowV2: React.FC<{ level: number; frame: number; highlightCycle?: boolean }> = ({
  level,
  frame,
  highlightCycle,
}) => {
  const cx = 640;
  const cy = 578;
  const activeHighlight = highlightCycle ? Math.floor((frame / 22) % 6) : -1;

  return (
    <g>
      {RAINBOW.map((col, idx) => {
        const radius = 440 - idx * 24;
        const isColored = idx < level;
        const isHighlighted = activeHighlight === idx;
        return (
          <path
            key={idx}
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={isColored ? col : idx % 2 === 0 ? "#B2BEC3" : "#CBD5E1"}
            strokeWidth={isHighlighted ? 29 : 22}
            opacity={isColored ? (isHighlighted ? 1 : 0.93) : 0.65}
            strokeLinecap="round"
          />
        );
      })}
      <CloudV2 x={215} y={532} scale={1.18} />
      <CloudV2 x={1065} y={532} scale={1.18} />
    </g>
  );
};

const TreeV2: React.FC<{ x: number; y: number; scale?: number; frame: number; tint?: string }> = ({
  x,
  y,
  scale = 1,
  frame,
  tint = "#26DE81",
}) => {
  const sway = Math.sin(frame * 0.06 + x * 0.01) * 2.2;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x={-14} y={-95} width={28} height={105} rx={10} fill="#A0653B" stroke={OUTLINE} strokeWidth={3} />
      <g transform={`translate(0, -100) rotate(${sway})`}>
        <circle cx={-34} cy={12} r={38} fill={tint} stroke={OUTLINE} strokeWidth={3} />
        <circle cx={34} cy={12} r={38} fill={tint} stroke={OUTLINE} strokeWidth={3} />
        <circle cx={0} cy={-24} r={46} fill={tint} stroke={OUTLINE} strokeWidth={3} />
        <circle cx={-20} cy={-16} r={6} fill="#FF6B81" />
        <circle cx={24} cy={4} r={6} fill="#FFD43B" />
        <circle cx={4} cy={-38} r={5.5} fill="#FF9F43" />
      </g>
    </g>
  );
};

const HouseV2: React.FC<{ x: number; y: number; wall: string; roof: string; scale?: number }> = ({
  x,
  y,
  wall,
  roof,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x={28} y={-118} width={18} height={36} rx={4} fill="#E17055" stroke={OUTLINE} strokeWidth={3} />
    <rect x={-55} y={-76} width={110} height={80} rx={10} fill={wall} stroke={OUTLINE} strokeWidth={3.5} />
    <polygon points="-70,-72 0,-130 70,-72" fill={roof} stroke={OUTLINE} strokeWidth={3.8} strokeLinejoin="round" />
    <path d="M -16 4 L -16 -34 A 16 16 0 0 1 16 -34 L 16 4 Z" fill="#A0653B" stroke={OUTLINE} strokeWidth={3} />
    <circle cx={8} cy={-16} r={3} fill="#FFD43B" />
    <circle cx={-34} cy={-44} r={12} fill="#DFF9FB" stroke={OUTLINE} strokeWidth={3} />
    <circle cx={34} cy={-44} r={12} fill="#DFF9FB" stroke={OUTLINE} strokeWidth={3} />
  </g>
);

const FlowerV2: React.FC<{ x: number; y: number; color: string; frame: number }> = ({ x, y, color, frame }) => {
  const sway = Math.sin(frame * 0.1 + x * 0.05) * 6;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d={`M 0 0 Q ${sway * 0.4} -14 ${sway} -26`} fill="none" stroke="#20BF6B" strokeWidth={4} strokeLinecap="round" />
      <g transform={`translate(${sway}, -28)`}>
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 8} cy={Math.sin((a * Math.PI) / 180) * 8} r={6} fill={color} />
        ))}
        <circle cx={0} cy={0} r={5.5} fill="#FFD43B" />
      </g>
    </g>
  );
};

export const SceneBackgroundV2: React.FC<SceneBackgroundV2Props> = ({
  scene,
  globalFrame,
  beatFrame,
  fps,
  props,
  cameraX = 0,
}) => {
  const pxSlow = cameraX * 0.12;
  const cloud1 = ((globalFrame * 0.65) % 1500) - 120 + pxSlow;
  const cloud2 = ((globalFrame * 0.45 + 620) % 1500) - 120 + pxSlow;
  const cloud3 = ((globalFrame * 0.55 + 1080) % 1500) - 120 + pxSlow;

  if (scene === "intro_stage" || scene === "title_card" || scene === "outro_stage") {
    const spin = (globalFrame * 0.45) % 360;
    return (
      <g>
        <defs>
          <linearGradient id="v2IntroSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3BB8FF" />
            <stop offset="65%" stopColor="#B8E9FF" />
            <stop offset="100%" stopColor="#FFF5D6" />
          </linearGradient>
        </defs>
        <rect width={1280} height={720} fill="url(#v2IntroSky)" />
        <g transform={`translate(640, 360) rotate(${spin})`} opacity={0.18}>
          {Array.from({ length: 16 }).map((_, i) => (
            <polygon key={i} points="0,0 -45,-800 45,-800" fill="#FFFFFF" transform={`rotate(${i * 22.5})`} />
          ))}
        </g>
        <RainbowV2 level={6} frame={globalFrame} />
        <CloudV2 x={cloud1} y={110} scale={1.05} />
        <CloudV2 x={cloud2} y={165} scale={0.85} />
        <ellipse cx={640} cy={715} rx={860} ry={175} fill="#55E6C1" />
        <ellipse cx={640} cy={735} rx={840} ry={165} fill="#2ED573" />
        {[120, 260, 1020, 1160].map((fx, i) => (
          <FlowerV2 key={i} x={fx} y={620 + (i % 2) * 20} color={RAINBOW[i % 6]} frame={globalFrame} />
        ))}
      </g>
    );
  }

  if (scene === "garden_red") {
    const found = props.strawberries_found ?? 0;
    const bugX = props.ladybug_focus ? 720 + Math.sin(globalFrame * 0.16) * 55 : 220 + ((globalFrame * 3.5) % 900);
    const bugY = props.ladybug_focus ? 385 + Math.cos(globalFrame * 0.24) * 26 : 245 + Math.sin(globalFrame * 0.18) * 35;
    return (
      <g>
        <defs>
          <linearGradient id="v2GardenSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ECBFF" />
            <stop offset="100%" stopColor="#FFF4D2" />
          </linearGradient>
        </defs>
        <rect width={1280} height={720} fill="url(#v2GardenSky)" />
        <SunV2 x={1135} y={110} frame={globalFrame} scale={0.95} />
        <CloudV2 x={cloud1} y={105} scale={0.9} />
        <CloudV2 x={cloud2} y={160} scale={0.75} />
        <ellipse cx={340} cy={520} rx={540} ry={170} fill="#7BED9F" />
        <ellipse cx={980} cy={530} rx={520} ry={165} fill="#55E6C1" />
        <TreeV2 x={95} y={485} scale={0.85} frame={globalFrame} tint="#20BF6B" />
        <TreeV2 x={1195} y={485} scale={0.9} frame={globalFrame} tint="#26DE81" />
        <g>
          <rect x={0} y={438} width={1280} height={14} fill="#FFFDF7" stroke={OUTLINE} strokeWidth={2.5} />
          <rect x={0} y={474} width={1280} height={14} fill="#FFFDF7" stroke={OUTLINE} strokeWidth={2.5} />
          {Array.from({ length: 18 }).map((_, i) => (
            <path key={i} d={`M ${i * 74 + 14} 505 L ${i * 74 + 14} 418 L ${i * 74 + 28} 404 L ${i * 74 + 42} 418 L ${i * 74 + 42} 505 Z`} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={2.5} />
          ))}
        </g>
        <rect x={0} y={495} width={1280} height={225} fill="#38C172" />
        <rect x={800} y={530} width={440} height={140} rx={28} fill="#A0653B" stroke={OUTLINE} strokeWidth={4} />
        <ellipse cx={885} cy={540} rx={68} ry={40} fill="#20BF6B" stroke={OUTLINE} strokeWidth={3} />
        <ellipse cx={1020} cy={525} rx={76} ry={44} fill="#26DE81" stroke={OUTLINE} strokeWidth={3} />
        <ellipse cx={1155} cy={545} rx={68} ry={40} fill="#20BF6B" stroke={OUTLINE} strokeWidth={3} />
        {[875, 1020, 1155].map((sx, idx) => {
          const isFound = idx + 1 <= found;
          const sy = idx === 1 ? 530 : 554;
          const b = isFound ? Math.sin(globalFrame * 0.25 + idx) * 8 : props.highlight_strawberries ? Math.sin(globalFrame * 0.15 + idx) * 4 : 0;
          return (
            <g key={idx} transform={`translate(${sx}, ${sy + b}) scale(${isFound ? 1.2 : 1})`}>
              {(isFound || props.highlight_strawberries) && (
                <circle cx={0} cy={0} r={46 + Math.sin(globalFrame * 0.2 + idx) * 6} fill="#FF4757" opacity={isFound ? 0.28 : 0.14} />
              )}
              <path d="M -26 -14 C -32 14 -12 36 0 40 C 12 36 32 14 26 -14 C 20 -26 -20 -26 -26 -14 Z" fill="#FF3B4E" stroke={OUTLINE} strokeWidth={3.5} />
              <circle cx={-10} cy={-4} r={2.5} fill="#FFEAA7" />
              <circle cx={10} cy={-2} r={2.5} fill="#FFEAA7" />
              <circle cx={0} cy={12} r={2.5} fill="#FFEAA7" />
              <circle cx={-12} cy={16} r={2.5} fill="#FFEAA7" />
              <circle cx={11} cy={18} r={2.5} fill="#FFEAA7" />
              <path d="M -22 -18 Q -10 -32 0 -22 Q 10 -32 22 -18 Q 10 -12 0 -16 Q -10 -12 -22 -18 Z" fill="#2ECC71" stroke={OUTLINE} strokeWidth={2.8} />
              {isFound && (
                <g transform="translate(0, -48)">
                  <circle cx={0} cy={0} r={20} fill="#FFD43B" stroke={OUTLINE} strokeWidth={3} />
                  <text x={0} y={8} textAnchor="middle" fontSize={24} fontWeight={800} fill={OUTLINE} fontFamily={FONT_DISPLAY}>{idx + 1}</text>
                </g>
              )}
            </g>
          );
        })}
        {props.red_orb_visible && (
          <g transform={`translate(1020, ${340 + Math.sin(globalFrame * 0.2) * 14})`}>
            <circle cx={0} cy={0} r={54} fill="#FF4757" opacity={0.25} />
            <circle cx={0} cy={0} r={34} fill="#FF4757" stroke="#FFFFFF" strokeWidth={5} />
            <circle cx={-10} cy={-10} r={9} fill="#FFFFFF" opacity={0.78} />
          </g>
        )}
        <g transform={`translate(${bugX}, ${bugY})`}>
          <ellipse cx={-10} cy={-10} rx={12} ry={6} fill="#FFFFFF" opacity={0.85} transform={`rotate(${Math.sin(globalFrame * 1.4) * 28 - 25} -10 -10)`} />
          <ellipse cx={10} cy={-10} rx={12} ry={6} fill="#FFFFFF" opacity={0.85} transform={`rotate(${-Math.sin(globalFrame * 1.4) * 28 + 25} 10 -10)`} />
          <ellipse cx={0} cy={0} rx={16} ry={13} fill="#FF3B4E" stroke={OUTLINE} strokeWidth={2.5} />
          <circle cx={14} cy={0} r={8} fill={OUTLINE} />
          <circle cx={-4} cy={-3} r={3} fill={OUTLINE} />
          <circle cx={4} cy={4} r={3} fill={OUTLINE} />
          <circle cx={-8} cy={5} r={2.5} fill={OUTLINE} />
        </g>
      </g>
    );
  }

  if (scene === "sunflower_yellow") {
    const awake = Boolean(props.sunflowers_awake);
    return (
      <g>
        <defs>
          <linearGradient id="v2SunSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4BC3FF" />
            <stop offset="65%" stopColor="#FFF3B0" />
            <stop offset="100%" stopColor="#FFEAA7" />
          </linearGradient>
        </defs>
        <rect width={1280} height={720} fill="url(#v2SunSky)" />
        <SunV2 x={640} y={120} frame={globalFrame} scale={1.15} glow />
        <CloudV2 x={cloud1} y={135} scale={0.9} />
        <CloudV2 x={cloud2} y={110} scale={0.8} />
        <ellipse cx={300} cy={540} rx={520} ry={175} fill="#A3CB38" />
        <ellipse cx={980} cy={545} rx={540} ry={175} fill="#C4E538" />
        <path d="M 0 510 Q 640 475 1280 510 L 1280 720 L 0 720 Z" fill="#78E08F" />
        {[
          { x: 115, y: 545, h: 195 },
          { x: 875, y: 565, h: 210 },
          { x: 1025, y: 580, h: 240 },
          { x: 1175, y: 565, h: 200 },
        ].map((sf, i) => {
          const wakeS = awake ? spring({ frame: beatFrame, fps, config: { damping: 10, stiffness: 90 } }) : 0;
          const droop = awake ? interpolate(wakeS, [0, 1], [34, 0]) : 34 + Math.sin(globalFrame * 0.08 + sf.x) * 3;
          const sway = awake ? Math.sin(globalFrame * 0.14 + sf.x * 0.02) * 7 : 0;
          const spin = awake ? (globalFrame * 0.6) % 360 : 0;
          return (
            <g key={i} transform={`translate(${sf.x}, ${sf.y})`}>
              <path d={`M 0 0 Q ${sway * 0.5} ${-sf.h * 0.5} ${sway + droop * 0.5} ${-sf.h}`} fill="none" stroke="#20BF6B" strokeWidth={11} strokeLinecap="round" />
              <ellipse cx={-22} cy={-sf.h * 0.45} rx={22} ry={11} fill="#26DE81" stroke={OUTLINE} strokeWidth={2.5} transform={`rotate(-25 -22 ${-sf.h * 0.45})`} />
              <ellipse cx={22} cy={-sf.h * 0.35} rx={22} ry={11} fill="#26DE81" stroke={OUTLINE} strokeWidth={2.5} transform={`rotate(25 22 ${-sf.h * 0.35})`} />
              <g transform={`translate(${sway + droop * 0.5}, ${-sf.h}) rotate(${droop})`}>
                <g transform={`rotate(${spin})`}>
                  {Array.from({ length: 12 }).map((_, j) => (
                    <ellipse key={j} cx={0} cy={-42} rx={11} ry={20} fill={awake ? "#FFD43B" : "#E5C158"} stroke={OUTLINE} strokeWidth={2.4} transform={`rotate(${j * 30})`} />
                  ))}
                </g>
                <circle cx={0} cy={0} r={30} fill="#8B5A2B" stroke={OUTLINE} strokeWidth={3.2} />
                {awake ? (
                  <>
                    <circle cx={-10} cy={-5} r={4} fill="#FFFFFF" />
                    <circle cx={-10} cy={-5} r={2.2} fill={OUTLINE} />
                    <circle cx={10} cy={-5} r={4} fill="#FFFFFF" />
                    <circle cx={10} cy={-5} r={2.2} fill={OUTLINE} />
                    <ellipse cx={-17} cy={4} rx={5} ry={3} fill="#FF8DA1" opacity={0.75} />
                    <ellipse cx={17} cy={4} rx={5} ry={3} fill="#FF8DA1" opacity={0.75} />
                    <path d="M -11 6 Q 0 18 11 6" fill="none" stroke="#FFF2A6" strokeWidth={3.5} strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <path d="M -15 -3 Q -10 3 -5 -3 M 5 -3 Q 10 3 15 -3" fill="none" stroke="#FFEAA7" strokeWidth={2.8} strokeLinecap="round" />
                    <circle cx={0} cy={10} r={4} fill="#5C3A1A" />
                    <text x={28} y={-28 + Math.sin(globalFrame * 0.12 + sf.x) * 5} fontSize={20} fontWeight={800} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" paintOrder="stroke fill" fontFamily={FONT_DISPLAY}>zZz</text>
                  </>
                )}
              </g>
            </g>
          );
        })}
        {[0, 1].map((b) => {
          const bx = ((globalFrame * (2.6 + b) + b * 480) % 1360) - 40;
          const by = 220 + b * 70 + Math.sin(globalFrame * 0.2 + b * 3) * 28;
          const flap = 0.4 + Math.abs(Math.sin(globalFrame * 0.65 + b)) * 0.6;
          return (
            <g key={b} transform={`translate(${bx}, ${by})`}>
              <ellipse cx={-10} cy={-4} rx={12} ry={14 * flap} fill="#FFD43B" stroke={OUTLINE} strokeWidth={2} />
              <ellipse cx={10} cy={-4} rx={12} ry={14 * flap} fill="#FFD43B" stroke={OUTLINE} strokeWidth={2} />
              <rect x={-2.5} y={-10} width={5} height={18} rx={2.5} fill={OUTLINE} />
            </g>
          );
        })}
        {awake &&
          Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx={800 + ((i * 67 + globalFrame * 2) % 450)} cy={520 - ((i * 43 + globalFrame * 3.2) % 380)} r={4 + (i % 3) * 2} fill="#FFF200" opacity={0.8} />
          ))}
        {props.yellow_orb_visible && (
          <g transform={`translate(1025, ${245 + Math.sin(globalFrame * 0.22) * 14})`}>
            <circle cx={0} cy={0} r={54} fill="#FFD43B" opacity={0.32} />
            <circle cx={0} cy={0} r={34} fill="#FFD43B" stroke="#FFFFFF" strokeWidth={5} />
            <circle cx={-10} cy={-10} r={9} fill="#FFFFFF" opacity={0.85} />
          </g>
        )}
      </g>
    );
  }

  if (scene === "pond_blue") {
    const bubbleState = props.bubble_state ?? "high";
    const heroBubbleY =
      bubbleState === "high"
        ? 185 + Math.sin(globalFrame * 0.12) * 18
        : bubbleState === "descending"
        ? interpolate(beatFrame, [0, 140], [185, 445], { extrapolateRight: "clamp" }) + Math.sin(globalFrame * 0.2) * 10
        : 450;
    const heroBubbleX =
      bubbleState === "descending"
        ? interpolate(beatFrame, [0, 140], [990, 910], { extrapolateRight: "clamp" }) + Math.sin(globalFrame * 0.16) * 22
        : 990 + Math.cos(globalFrame * 0.08) * 16;
    const fishPhase = (globalFrame % 65) / 65;
    const fishArcY = 555 - Math.sin(fishPhase * Math.PI) * 115;
    const fishArcX = 910 + fishPhase * 180;

    return (
      <g>
        <defs>
          <linearGradient id="v2PondSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34ACE0" />
            <stop offset="100%" stopColor="#DFF9FB" />
          </linearGradient>
          <linearGradient id="v2WaterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#45AAF2" />
            <stop offset="100%" stopColor="#2E86DE" />
          </linearGradient>
        </defs>
        <rect width={1280} height={720} fill="url(#v2PondSky)" />
        <SunV2 x={130} y={105} frame={globalFrame} scale={0.9} />
        <CloudV2 x={cloud1} y={105} scale={0.95} />
        <CloudV2 x={cloud2} y={155} scale={0.8} />
        <ellipse cx={280} cy={535} rx={520} ry={175} fill="#7BED9F" />
        <TreeV2 x={85} y={495} scale={0.88} frame={globalFrame} tint="#20BF6B" />
        <TreeV2 x={1210} y={495} scale={0.92} frame={globalFrame} tint="#26DE81" />
        <rect x={0} y={500} width={1280} height={220} fill="url(#v2WaterGrad)" />
        <path d="M 0 490 Q 620 475 810 560 Q 860 640 790 720 L 0 720 Z" fill="#2ED573" />
        {[0, 1, 2, 3].map((row) => (
          <path
            key={row}
            d={`M ${835 + Math.sin(globalFrame * 0.1 + row) * 14} ${540 + row * 40} Q 940 ${530 + row * 40} 1050 ${540 + row * 40} T 1245 ${540 + row * 40}`}
            fill="none"
            stroke="#C7ECEE"
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.65}
          />
        ))}
        <ellipse cx={920} cy={615} rx={48} ry={16} fill="#20BF6B" stroke={OUTLINE} strokeWidth={2.5} />
        <ellipse cx={1135} cy={580} rx={42} ry={14} fill="#26DE81" stroke={OUTLINE} strokeWidth={2.5} />
        <circle cx={1135} cy={572} r={10} fill="#FF9FF3" stroke={OUTLINE} strokeWidth={2} />
        {props.fish_jump && fishPhase < 0.85 && (
          <g transform={`translate(${fishArcX}, ${fishArcY}) rotate(${(fishPhase - 0.5) * 90})`}>
            <polygon points="-24,0 -40,-14 -40,14" fill="#00D2D3" stroke={OUTLINE} strokeWidth={2.5} />
            <ellipse cx={0} cy={0} rx={24} ry={15} fill="#54A0FF" stroke={OUTLINE} strokeWidth={2.8} />
            <circle cx={10} cy={-4} r={3.5} fill="#FFFFFF" />
            <circle cx={11} cy={-4} r={1.8} fill={OUTLINE} />
            <path d="M 10 5 Q 16 9 20 5" fill="none" stroke={OUTLINE} strokeWidth={2} />
          </g>
        )}
        {Array.from({ length: 12 }).map((_, i) => {
          const bx = 830 + ((i * 73) % 420) + Math.sin(globalFrame * 0.08 + i) * 18;
          const by = 600 - ((globalFrame * (1.8 + (i % 3) * 0.7) + i * 95) % 560);
          const r = 10 + (i % 4) * 5;
          return (
            <g key={i} transform={`translate(${bx}, ${by})`} opacity={0.72}>
              <circle cx={0} cy={0} r={r} fill="#DFF9FB" fillOpacity={0.35} stroke="#FFFFFF" strokeWidth={2.5} />
              <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.25} fill="#FFFFFF" />
            </g>
          );
        })}
        {bubbleState !== "popped" ? (
          <g transform={`translate(${heroBubbleX}, ${heroBubbleY})`}>
            <circle cx={0} cy={0} r={34} fill="#1E90FF" stroke="#FFFFFF" strokeWidth={4} />
            <circle cx={-10} cy={-10} r={9} fill="#FFFFFF" opacity={0.8} />
            <circle cx={0} cy={0} r={76 + Math.sin(globalFrame * 0.18) * 3} fill="#70D6FF" fillOpacity={0.22} stroke="#FFFFFF" strokeWidth={5} />
            <path d="M -46 -34 A 58 58 0 0 1 -10 -56" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.85} />
            <circle cx={38} cy={30} r={9} fill="#FF9FF3" opacity={0.45} />
          </g>
        ) : (
          <g transform="translate(915, 415)">
            {Array.from({ length: 8 }).map((_, i) => {
              const ang = (i * Math.PI * 2) / 8 + globalFrame * 0.04;
              const dist = 28 + Math.sin(globalFrame * 0.2 + i) * 14;
              return <circle key={i} cx={Math.cos(ang) * dist} cy={Math.sin(ang) * dist} r={7} fill={i % 2 === 0 ? "#45AAF2" : "#FFFFFF"} />;
            })}
          </g>
        )}
      </g>
    );
  }

  if (scene === "forest_mystery") {
    // Novo Cenário Ep. 2+: Floresta Mágica com raios de sol, cogumelos, vaga-lumes e Ovo Colorido Misterioso!
    const eggWobble = Math.sin(globalFrame * 0.24) * 6;
    return (
      <g>
        <defs>
          <linearGradient id="v2ForestSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#48DBFB" />
            <stop offset="65%" stopColor="#B8F2E6" />
            <stop offset="100%" stopColor="#FFF5CC" />
          </linearGradient>
        </defs>
        <rect width={1280} height={720} fill="url(#v2ForestSky)" />
        {/* Raios de sol dourados atravessando a copa das árvores */}
        <polygon points="180,0 380,0 640,720 340,720" fill="#FFF7AE" opacity={0.18} />
        <polygon points="740,0 920,0 1160,720 880,720" fill="#FFF7AE" opacity={0.16} />
        <CloudV2 x={cloud1} y={95} scale={0.85} opacity={0.85} />
        <ellipse cx={300} cy={530} rx={560} ry={180} fill="#55E6C1" />
        <ellipse cx={990} cy={535} rx={560} ry={185} fill="#26DE81" />
        <TreeV2 x={90} y={505} scale={1.1} frame={globalFrame} tint="#20BF6B" />
        <TreeV2 x={285} y={480} scale={0.82} frame={globalFrame} tint="#2ED573" />
        <TreeV2 x={1095} y={495} scale={0.95} frame={globalFrame} tint="#20BF6B" />
        <TreeV2 x={1225} y={515} scale={1.12} frame={globalFrame} tint="#1DB954" />
        <path d="M 0 515 Q 640 475 1280 515 L 1280 720 L 0 720 Z" fill="#2ED573" />
        {/* Cogumelos fofos de conto de fadas */}
        {[{ x: 145, y: 610, s: 0.9 }, { x: 830, y: 585, s: 0.78 }, { x: 1170, y: 625, s: 0.95 }].map((m, i) => (
          <g key={i} transform={`translate(${m.x}, ${m.y}) scale(${m.s})`}>
            <rect x={-12} y={-28} width={24} height={32} rx={8} fill="#FFF5E1" stroke={OUTLINE} strokeWidth={2.8} />
            <path d="M -34 -24 Q 0 -64 34 -24 Z" fill="#FF4757" stroke={OUTLINE} strokeWidth={3} />
            <circle cx={-12} cy={-38} r={5} fill="#FFFFFF" />
            <circle cx={10} cy={-44} r={4.5} fill="#FFFFFF" />
            <circle cx={16} cy={-30} r={4} fill="#FFFFFF" />
          </g>
        ))}
        {/* Ninho + OVO COLORIDO MISTERIOSO com formas geométricas balançando! */}
        <g transform="translate(1015, 570)">
          <ellipse cx={0} cy={14} rx={72} ry={24} fill="#B87A3B" stroke={OUTLINE} strokeWidth={3.5} />
          <g transform={`translate(0, 6) rotate(${eggWobble})`}>
            <ellipse cx={0} cy={-46} rx={44} ry={58} fill="#FFFDF5" stroke={OUTLINE} strokeWidth={4} />
            <circle cx={-14} cy={-62} r={11} fill="#FF4757" />
            <rect x={6} y={-44} width={20} height={20} rx={4} fill="#1E90FF" />
            <polygon points="-20,-20 -4,-20 -12,-36" fill="#FFD43B" />
            <circle cx={12} cy={-74} r={7} fill="#2ED573" />
          </g>
        </g>
        {/* Vaga-lumes / partículas mágicas brilhantes */}
        {Array.from({ length: 14 }).map((_, i) => (
          <circle
            key={i}
            cx={120 + ((i * 97 + globalFrame * 1.4) % 1080)}
            cy={180 + (i % 5) * 85 + Math.sin(globalFrame * 0.14 + i) * 24}
            r={4.5 + (i % 2) * 2}
            fill="#FFF7AE"
            opacity={0.45 + Math.abs(Math.sin(globalFrame * 0.18 + i)) * 0.55}
          />
        ))}
      </g>
    );
  }

  if (scene === "starry_night") {
    // Novo Cenário Ep. 5+: Noite Estrelada acolhedora na Vila das Cores!
    return (
      <g>
        <defs>
          <linearGradient id="v2NightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2A5E" />
            <stop offset="65%" stopColor="#354F9B" />
            <stop offset="100%" stopColor="#6C5CE7" />
          </linearGradient>
        </defs>
        <rect width={1280} height={720} fill="url(#v2NightSky)" />
        {/* Estrelinhas piscando */}
        {Array.from({ length: 28 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 113 + 45) % 1220}
            cy={40 + ((i * 67) % 340)}
            r={2.5 + (i % 3) * 1.4}
            fill="#FFF7AE"
            opacity={0.35 + Math.abs(Math.sin(globalFrame * 0.12 + i)) * 0.65}
          />
        ))}
        {/* Lua sorridente acolhedora */}
        <g transform="translate(1080, 125)">
          <circle cx={0} cy={0} r={58} fill="#FFE680" opacity={0.22} />
          <circle cx={0} cy={0} r={44} fill="#FFE680" stroke="#F7B731" strokeWidth={3.5} />
          <circle cx={-12} cy={-6} r={4} fill={OUTLINE} />
          <circle cx={12} cy={-6} r={4} fill={OUTLINE} />
          <path d="M -11 8 Q 0 18 11 8" fill="none" stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />
        </g>
        <ellipse cx={300} cy={565} rx={520} ry={165} fill="#266B5A" />
        <ellipse cx={1000} cy={575} rx={540} ry={170} fill="#1F594B" />
        <HouseV2 x={175} y={485} wall="#576574" roof="#EE5253" scale={0.85} />
        <HouseV2 x={1115} y={485} wall="#576574" roof="#FF9F43" scale={0.88} />
        {/* Janelas acesas quentinhas */}
        <circle cx={146} cy={447} r={10} fill="#FFE680" />
        <circle cx={204} cy={447} r={10} fill="#FFE680" />
        <circle cx={1085} cy={447} r={10} fill="#FFE680" />
        <circle cx={1145} cy={447} r={10} fill="#FFE680" />
        <path d="M 0 510 Q 640 465 1280 510 L 1280 720 L 0 720 Z" fill="#1E8449" />
      </g>
    );
  }

  const rainbowLevel = props.rainbow_level ?? (scene === "plaza_rainbow" ? 6 : 0);
  return (
    <g>
      <defs>
        <linearGradient id="v2PlazaSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={scene === "plaza_rainbow" ? "#3BB8FF" : "#74B9FF"} />
          <stop offset="100%" stopColor="#E2F8FF" />
        </linearGradient>
      </defs>
      <rect width={1280} height={720} fill="url(#v2PlazaSky)" />
      <SunV2 x={145} y={115} frame={globalFrame} glow={scene === "plaza_rainbow"} />
      {/* Passarinhos voando suavemente ao longe no céu (dá vida de desenho de TV!) */}
      {[0, 1].map((b) => {
        const bx = ((globalFrame * (1.8 + b * 0.4) + b * 360) % 1480) - 100;
        const by = 135 + b * 48 + Math.sin(globalFrame * 0.15 + b * 2) * 10;
        const wing = Math.sin(globalFrame * 0.35 + b) * 6;
        return (
          <path
            key={b}
            d={`M ${bx - 12} ${by + wing} Q ${bx - 5} ${by - 7} ${bx} ${by} Q ${bx + 5} ${by - 7} ${bx + 12} ${by + wing}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.78}
          />
        );
      })}
      <CloudV2 x={cloud1} y={115} scale={0.95} />
      <CloudV2 x={cloud2} y={175} scale={0.78} />
      <CloudV2 x={cloud3} y={95} scale={0.88} />
      <RainbowV2 level={rainbowLevel} frame={globalFrame} highlightCycle={props.rainbow_highlight_cycle} />
      <ellipse cx={280} cy={565} rx={480} ry={160} fill="#7BED9F" />
      <ellipse cx={1020} cy={575} rx={520} ry={170} fill="#70E08A" />
      <HouseV2 x={175} y={485} wall="#FFF3D6" roof="#FF5C7A" scale={0.85} />
      <HouseV2 x={1115} y={485} wall="#E6F4FF" roof="#FFA502" scale={0.88} />
      <TreeV2 x={65} y={530} scale={0.9} frame={globalFrame} tint="#2ED573" />
      <TreeV2 x={1225} y={535} scale={0.95} frame={globalFrame} tint="#26DE81" />
      <path d="M 0 510 Q 640 465 1280 510 L 1280 720 L 0 720 Z" fill="#2ED573" />
      <path d="M 380 720 Q 640 535 900 720 Z" fill="#F8EFBA" opacity={0.78} />
      {[110, 210, 320, 960, 1085, 1180].map((fx, i) => (
        <FlowerV2 key={i} x={fx} y={615 + (i % 3) * 22} color={RAINBOW[i % 6]} frame={globalFrame} />
      ))}
    </g>
  );
};

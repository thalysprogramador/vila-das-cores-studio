import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timelineRaw from "../public/episode_timeline.json";
import { CharacterRigV2 } from "./characters";
import { ConfettiV2, InteractivePromptV2, MagicBasketV2, PopBadgeV2 } from "./OverlaysV2";
import { DynamicScene } from "./scenes/DynamicScene";
import { FONT_DISPLAY, FONT_UI, PALETTE } from "./theme";
import { Beat, EpisodeTimeline } from "./types";

const timeline = timelineRaw as unknown as EpisodeTimeline;
const OUTLINE = PALETTE.outline;

export type ShortProps = {
  clipStartFrame: number;
  clipEndFrame: number;
  hookBadge: string;
};

function findBeatAtFrame(frame: number): Beat {
  for (const b of timeline.beats) {
    if (frame >= b.startFrame && frame < b.endFrame) return b;
  }
  return timeline.beats[timeline.beats.length - 1];
}

/**
 * Short Vertical Nativo (1080x1920 @ 24fps) recortado de forma inteligente do episódio!
 * Centraliza automaticamente no personagem que está falando + banner chamativo no topo e rodapé.
 */
export const Short1080x1920: React.FC<ShortProps> = ({
  clipStartFrame = 0,
  clipEndFrame = 600,
  hookBadge = "QUE FOFURA! 🌈",
}) => {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const globalFrame = clipStartFrame + localFrame;

  const beat = findBeatAtFrame(globalFrame);
  const beatFrame = Math.max(0, globalFrame - beat.startFrame);

  const speakingChar = beat.speaker ? beat.chars.find((c) => c.id === beat.speaker) : beat.chars[0];
  const focusX = speakingChar ? Math.max(320, Math.min(960, speakingChar.x)) : 640;

  const currentViseme =
    beat.mouthFrames && beatFrame < beat.mouthFrames.length ? beat.mouthFrames[beatFrame] : 0;
  const sortedChars = [...beat.chars].sort((a, b) => a.y - b.y);

  const headerSpring = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 110 } });
  const ctaPulse = 1 + Math.sin(localFrame * 0.22) * 0.035;

  // Enquadra o mundo 1280x720 no centro vertical do 1080x1920 com zoom focado nos personagens!
  const worldScale = 1.85;
  const worldTx = 540 - focusX * worldScale;
  const worldTy = 980 - 445 * worldScale;

  return (
    <AbsoluteFill style={{ backgroundColor: "#3BB8FF" }}>
      {timeline.audioFile ? (
        <Sequence from={0}>
          <Audio src={staticFile(timeline.audioFile)} startFrom={clipStartFrame} endAt={clipEndFrame} />
        </Sequence>
      ) : null}

      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ display: "block" }}>
        <defs>
          <linearGradient id="shortTopGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1FA2FF" />
            <stop offset="100%" stopColor="#3BB8FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="shortBotGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1EB55D" stopOpacity="0" />
            <stop offset="100%" stopColor="#168D46" />
          </linearGradient>
        </defs>

        {/* Cena animada em alta definição focada no personagem ativo */}
        <g transform={`translate(${worldTx}, ${worldTy}) scale(${worldScale})`}>
          <DynamicScene
            scene={beat.scene}
            customScene={timeline.customScenes?.[beat.scene]}
            globalFrame={globalFrame}
            beatFrame={beatFrame}
            fps={fps}
            props={beat.props}
          />
          {sortedChars.map((ch) => {
            const isSpeaker = beat.speaker === ch.id;
            return (
              <CharacterRigV2
                key={ch.id}
                char={ch}
                globalFrame={globalFrame}
                beatFrame={beatFrame}
                fps={fps}
                isSpeaking={isSpeaker}
                mouthViseme={isSpeaker ? currentViseme : 0}
                lookTargetX={isSpeaker ? undefined : speakingChar?.x}
                uidPrefix="short"
              />
            );
          })}
          {beat.props.show_basket && <MagicBasketV2 orbs={beat.props.orbs_collected || []} frame={globalFrame} />}
          {beat.props.confetti && <ConfettiV2 frame={globalFrame} />}
        </g>

        {/* Gradientes suaves no topo e base para máxima leitura no YouTube Shorts */}
        <rect x={0} y={0} width={1080} height={380} fill="url(#shortTopGrad)" />
        <rect x={0} y={1460} width={1080} height={460} fill="url(#shortBotGrad)" />

        {/* Cabeçalho Sticker 3D da Série + Gancho do Short */}
        <g transform={`translate(540, 210) scale(${headerSpring})`}>
          <rect x={-390} y={-88} width={780} height={152} rx={44} fill="#FFFFFF" stroke="#FFD43B" strokeWidth={12} />
          <text
            x={0}
            y={-22}
            textAnchor="middle"
            fontSize={44}
            fontWeight={800}
            fontFamily={FONT_DISPLAY}
            fill="#1E90FF"
          >
            TICO &amp; A VILA DAS CORES
          </text>
          <text
            x={0}
            y={38}
            textAnchor="middle"
            fontSize={52}
            fontWeight={800}
            fontFamily={FONT_DISPLAY}
            fill="#FF4757"
            stroke={OUTLINE}
            strokeWidth={5}
            strokeLinejoin="round"
            paintOrder="stroke fill"
          >
            {hookBadge}
          </text>
        </g>

        {/* Badge educativo ou interação se existir na cena */}
        {beat.props.badge && (
          <g transform="translate(-100, 290)">
            <PopBadgeV2
              text={beat.props.badge.text}
              color={beat.props.badge.color}
              frame={beatFrame}
              fps={fps}
            />
          </g>
        )}
        {beat.props.interactive_prompt && (
          <g transform="translate(-100, 310)">
            <InteractivePromptV2 text={beat.props.interactive_prompt} frame={beatFrame} fps={fps} />
          </g>
        )}

        {/* CTA inferior puxando para o Episódio Completo no canal! */}
        <g transform={`translate(540, 1690) scale(${ctaPulse})`}>
          <rect x={-395} y={-52} width={790} height={104} rx={52} fill="#FFD43B" stroke="#FFFFFF" strokeWidth={10} />
          <rect x={-395} y={-52} width={790} height={104} rx={52} fill="none" stroke={OUTLINE} strokeWidth={4} />
          <text
            x={0}
            y={15}
            textAnchor="middle"
            fontSize={40}
            fontWeight={700}
            fontFamily={FONT_UI}
            fill={OUTLINE}
          >
            EPISÓDIO COMPLETO NO CANAL!
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timelineRaw from "../public/episode_timeline.json";
import { CharacterRigV2 } from "./characters";
import {
  ColorMixMagicV2,
  ConfettiV2,
  EpisodeTitleCardV2,
  InteractivePromptV2,
  MagicBasketV2,
  PopBadgeV2,
  SeriesLogoV2,
  ThreeColorsPreviewV2,
  TransitionV2,
} from "./OverlaysV2";
import { DynamicScene } from "./scenes/DynamicScene";
import { Beat, EpisodeTimeline } from "./types";

const timeline = timelineRaw as unknown as EpisodeTimeline;

function findBeatAtFrame(frame: number): { beat: Beat; index: number } {
  const beats = timeline.beats;
  for (let i = 0; i < beats.length; i++) {
    if (frame >= beats[i].startFrame && frame < beats[i].endFrame) {
      return { beat: beats[i], index: i };
    }
  }
  return { beat: beats[beats.length - 1], index: beats.length - 1 };
}

function getCameraTarget(beat: Beat): { scale: number; fx: number; fy: number } {
  let scale = 1.0;
  let fx = 640;
  let fy = 360;

  if (beat.camera === "sky") {
    scale = 1.12;
    fy = 275;
  } else if (beat.camera === "props") {
    scale = 1.14;
    fx = 760;
    fy = 400;
  } else if (beat.camera.startsWith("closeup_")) {
    const cid = beat.camera.replace("closeup_", "");
    const c = beat.chars.find((ch) => ch.id === cid);
    if (c) {
      scale = 1.22;
      fx = Math.max(380, Math.min(900, c.x));
      fy = Math.max(290, Math.min(440, c.y - 125));
    }
  }
  return { scale, fx, fy };
}

/** Câmera cinematográfica contínua: desliza suavemente da câmera do beat anterior para o atual! */
function getSmoothCamera(beat: Beat, prevBeat: Beat, beatFrame: number, fps: number) {
  const sameScene = prevBeat.scene === beat.scene && prevBeat.type === "dialogue";
  const from = sameScene ? getCameraTarget(prevBeat) : { scale: 1.0, fx: 640, fy: 360 };
  const to = getCameraTarget(beat);

  const prog = spring({ frame: beatFrame, fps, config: { damping: 24, stiffness: 46 } });
  const breatheZoom = Math.sin((beat.startFrame + beatFrame) * 0.03) * 0.008;

  const scale = interpolate(prog, [0, 1], [from.scale, to.scale]) + breatheZoom;
  const fx = interpolate(prog, [0, 1], [from.fx, to.fx]);
  const fy = interpolate(prog, [0, 1], [from.fy, to.fy]);

  const tx = Math.max(1280 - 1280 * scale, Math.min(0, 640 - fx * scale));
  const ty = Math.max(720 - 720 * scale, Math.min(0, 360 - fy * scale));
  return { scale, tx, ty, fx };
}

export const Episode1080p: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { beat, index } = findBeatAtFrame(frame);
  const beatFrame = frame - beat.startFrame;
  const isTransition = beat.type === "transition";
  const prevBeat = index > 0 ? timeline.beats[index - 1] : beat;
  const displayBeat = isTransition && beatFrame < beat.durationFrames * 0.5 ? prevBeat : beat;

  const cam = isTransition
    ? { scale: 1, tx: 0, ty: 0, fx: 640 }
    : getSmoothCamera(displayBeat, prevBeat, beatFrame, fps);

  const speakingChar = displayBeat.speaker ? displayBeat.chars.find((c) => c.id === displayBeat.speaker) : undefined;
  const sortedChars = [...displayBeat.chars].sort((a, b) => a.y - b.y);
  const currentViseme =
    displayBeat.mouthFrames && beatFrame >= 0 && beatFrame < displayBeat.mouthFrames.length
      ? displayBeat.mouthFrames[beatFrame]
      : 0;

  const sameSceneAsPrev = !isTransition && prevBeat.scene === displayBeat.scene && prevBeat.type === "dialogue";

  return (
    <AbsoluteFill style={{ backgroundColor: "#3BB8FF" }}>
      {timeline.audioFile ? <Audio src={staticFile(timeline.audioFile)} /> : null}
      <svg width={1920} height={1080} viewBox="0 0 1280 720" style={{ display: "block" }}>
        <g transform={`translate(${cam.tx}, ${cam.ty}) scale(${cam.scale})`}>
          <DynamicScene
            scene={displayBeat.scene}
            customScene={timeline.customScenes?.[displayBeat.scene]}
            globalFrame={frame}
            beatFrame={beatFrame}
            fps={fps}
            props={displayBeat.props}
            cameraX={cam.fx - 640}
          />
          {sortedChars.map((ch) => {
            const isSpeaker = displayBeat.speaker === ch.id;
            const prevCh = sameSceneAsPrev ? prevBeat.chars.find((p) => p.id === ch.id) : undefined;
            return (
              <CharacterRigV2
                key={ch.id}
                char={ch}
                prevX={prevCh?.x}
                prevY={prevCh?.y}
                globalFrame={frame}
                beatFrame={beatFrame}
                fps={fps}
                isSpeaking={isSpeaker}
                mouthViseme={isSpeaker ? currentViseme : 0}
                lookTargetX={isSpeaker ? undefined : speakingChar?.x}
              />
            );
          })}
        </g>

        {displayBeat.props.show_basket && <MagicBasketV2 orbs={displayBeat.props.orbs_collected || []} frame={frame} />}
        {displayBeat.props.show_three_colors_preview && <ThreeColorsPreviewV2 frame={beatFrame} fps={fps} />}
        {displayBeat.props.show_color_mix && <ColorMixMagicV2 frame={beatFrame} fps={fps} />}
        {displayBeat.props.badge && (
          <PopBadgeV2 text={displayBeat.props.badge.text} color={displayBeat.props.badge.color} frame={beatFrame} fps={fps} />
        )}
        {displayBeat.props.interactive_prompt && (
          <InteractivePromptV2 text={displayBeat.props.interactive_prompt} frame={beatFrame} fps={fps} />
        )}
        {displayBeat.props.confetti && <ConfettiV2 frame={frame} />}
        {displayBeat.props.show_logo && <SeriesLogoV2 frame={beatFrame} fps={fps} />}
        {displayBeat.props.show_outro && <SeriesLogoV2 frame={beatFrame} fps={fps} isOutro />}
        {displayBeat.scene === "title_card" && (
          <EpisodeTitleCardV2
            episode={displayBeat.props.episode || `EPISÓDIO ${timeline.episodeNumber}`}
            title={displayBeat.props.title || timeline.episodeTitle}
            frame={beatFrame}
            fps={fps}
          />
        )}

        {isTransition && <TransitionV2 beat={beat} beatFrame={beatFrame} />}
      </svg>
    </AbsoluteFill>
  );
};

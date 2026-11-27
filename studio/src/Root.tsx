import React from "react";
import { Composition } from "remotion";
import timelineRaw from "../public/episode_timeline.json";
import { BrandingBanner, BrandingLogo, BrandingWatermark, EpisodeThumb } from "./BrandingKit";
import { Episode1080p } from "./Episode1080p";
import { Short1080x1920, ShortProps } from "./Short1080x1920";
import { EpisodeTimeline } from "./types";

const timeline = timelineRaw as unknown as EpisodeTimeline;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. Episódio Completo Full HD 1920x1080 @ 24fps */}
      <Composition
        id="Episode1080p"
        component={Episode1080p}
        durationInFrames={Math.max(24, timeline.totalFrames)}
        fps={timeline.fps || 24}
        width={1920}
        height={1080}
      />

      {/* 2. Short Vertical Nativo 1080x1920 @ 24fps (2 cortes por episódio!) */}
      <Composition
        id="Short1080x1920"
        component={Short1080x1920}
        durationInFrames={720}
        fps={timeline.fps || 24}
        width={1080}
        height={1920}
        defaultProps={{
          clipStartFrame: 0,
          clipEndFrame: 720,
          hookBadge: "QUE AVENTURA!",
        }}
        calculateMetadata={({ props }) => {
          const p = props as unknown as ShortProps;
          const dur = Math.max(120, (p.clipEndFrame || 720) - (p.clipStartFrame || 0));
          return { durationInFrames: dur };
        }}
      />

      {/* 3. Identidade Visual Oficial do Canal */}
      <Composition id="BrandingLogo" component={BrandingLogo} durationInFrames={1} fps={24} width={800} height={800} />
      <Composition id="BrandingBanner" component={BrandingBanner} durationInFrames={1} fps={24} width={2560} height={1440} />
      <Composition id="BrandingWatermark" component={BrandingWatermark} durationInFrames={1} fps={24} width={150} height={150} />
      <Composition
        id="EpisodeThumb"
        component={EpisodeThumb}
        durationInFrames={1}
        fps={24}
        width={1280}
        height={720}
        defaultProps={{
          episodeNumber: timeline.episodeNumber || 1,
          badgeText: timeline.thumbnailBadge || "NOVA AVENTURA!",
          subText: timeline.thumbnailSub || "VILA DAS CORES!",
          customBgSvg:
            (timeline.thumbnailSceneKey && timeline.customScenes?.[timeline.thumbnailSceneKey]?.svg_inner) ||
            Object.values(timeline.customScenes || {}).find((s) => s?.svg_inner)?.svg_inner ||
            null,
          accentColor:
            timeline.thumbnailAccent ||
            (timeline.thumbnailSceneKey && timeline.customScenes?.[timeline.thumbnailSceneKey]?.accent_color) ||
            "#FF4757",
          bgTop:
            (timeline.thumbnailSceneKey && timeline.customScenes?.[timeline.thumbnailSceneKey]?.thumb_bg_top) ||
            "#62CFFF",
          bgBottom:
            (timeline.thumbnailSceneKey && timeline.customScenes?.[timeline.thumbnailSceneKey]?.thumb_bg_bottom) ||
            "#1B85E5",
        }}
      />
    </>
  );
};

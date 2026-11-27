export type CharacterId = "tico" | "lili" | "dino" | "nina" | string;

export type Emotion =
  | "happy"
  | "excited"
  | "surprised"
  | "curious"
  | "sad"
  | "thinking"
  | "proud"
  | "laughing";

export type Action =
  | "idle"
  | "wave"
  | "jump"
  | "bounce"
  | "clap"
  | "celebrate"
  | "dance"
  | "trip"
  | "look_up"
  | "think"
  | "blow"
  | "walk_in"
  | "fly_in"
  | "fly_idle";

export interface CharState {
  id: CharacterId;
  x: number;
  y: number;
  facing: "left" | "right";
  emotion: Emotion;
  action: Action;
}

export interface BadgeProp {
  text: string;
  color: string;
}

export interface PropsState {
  rainbow_level?: number;
  orbs_collected?: string[];
  show_logo?: boolean;
  show_outro?: boolean;
  show_basket?: boolean;
  show_three_colors_preview?: boolean;
  show_color_mix?: boolean;
  rainbow_highlight_cycle?: boolean;
  interactive_prompt?: string;
  badge?: BadgeProp;
  title?: string;
  episode?: string;
  strawberries_found?: number;
  highlight_strawberries?: boolean;
  red_orb_visible?: boolean;
  ladybug_focus?: boolean;
  sunflowers_awake?: boolean;
  yellow_orb_visible?: boolean;
  bubble_state?: "high" | "descending" | "popped";
  fish_jump?: boolean;
  confetti?: boolean;
  transition_kind?: "cloud" | "star" | "bubble" | "rainbow";
  transition_color?: string;
}

export interface Beat {
  id: string;
  type: "dialogue" | "intro_sequence" | "title_card" | "transition" | "outro_card";
  scene: string;
  bgm_mood: string;
  speaker: CharacterId | null;
  text: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  camera: string;
  chars: CharState[];
  props: PropsState;
  mouthFrames: number[];
}

export interface CustomSceneAsset {
  location_name: string;
  svg_inner: string | null;
  fx: string;
  sky_mood: string;
  accent_color?: string;
  thumb_bg_top?: string;
  thumb_bg_bottom?: string;
}

export interface EpisodeTimeline {
  seriesTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  thumbnailBadge?: string;
  thumbnailSub?: string;
  thumbnailSceneKey?: string;
  thumbnailAccent?: string;
  thumbnailEmotion?: Emotion;
  customScenes?: Record<string, CustomSceneAsset>;
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  durationSec: number;
  audioFile: string;
  beats: Beat[];
}

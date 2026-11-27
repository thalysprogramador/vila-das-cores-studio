import React from "react";
import { AbsoluteFill } from "remotion";
import { DinoV2, LiliV2, NinaV2, TicoV2 } from "./characters";
import { FONT_DISPLAY, FONT_UI, PALETTE } from "./theme";

const OUTLINE = PALETTE.outline;
const RAINBOW = PALETTE.rainbow;

/** Estrelinha 4-pontas brilhante estilo livro ilustrado */
const SparkleStar: React.FC<{ x: number; y: number; r?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  r = 16,
  color = "#FFFFFF",
  opacity = 0.92,
}) => (
  <path
    d={`M ${x} ${y - r} Q ${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q ${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q ${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q ${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`}
    fill={color}
    opacity={opacity}
  />
);

/** Nuvem volumétrica macia com sombra azulada suave na base */
const ProCloud: React.FC<{ x: number; y: number; scale?: number; opacity?: number }> = ({
  x,
  y,
  scale = 1,
  opacity = 0.96,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
    <ellipse cx={0} cy={18} rx={68} ry={22} fill="#D7F0FF" />
    <ellipse cx={0} cy={12} rx={66} ry={23} fill="#FFFFFF" />
    <circle cx={-36} cy={4} r={27} fill="#FFFFFF" />
    <circle cx={0} cy={-10} r={36} fill="#FFFFFF" />
    <circle cx={38} cy={4} r={25} fill="#FFFFFF" />
  </g>
);

/** Casinha colorida de livro infantil */
const ProCottage: React.FC<{ x: number; y: number; wall: string; roof: string; scale?: number }> = ({
  x,
  y,
  wall,
  roof,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x={30} y={-124} width={20} height={40} rx={5} fill="#E17055" stroke={OUTLINE} strokeWidth={3.5} />
    <rect x={-58} y={-78} width={116} height={82} rx={12} fill={wall} stroke={OUTLINE} strokeWidth={3.8} />
    <polygon points="-74,-74 0,-136 74,-74" fill={roof} stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -17 4 L -17 -35 A 17 17 0 0 1 17 -35 L 17 4 Z" fill="#A0653B" stroke={OUTLINE} strokeWidth={3.2} />
    <circle cx={9} cy={-16} r={3.5} fill="#FFD43B" />
    <circle cx={-35} cy={-44} r={13} fill="#C8F1FF" stroke={OUTLINE} strokeWidth={3.2} />
    <circle cx={35} cy={-44} r={13} fill="#C8F1FF" stroke={OUTLINE} strokeWidth={3.2} />
  </g>
);

/** Texto estilo Sticker 3D Profissional de Canal Infantil (sombra + borda branca grossa + contorno + cor) */
const StickerText: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  fill: string;
  whiteBorder?: number;
  darkBorder?: number;
  letterSpacing?: number;
}> = ({ text, x, y, size, fill, whiteBorder = 20, darkBorder = 7, letterSpacing = 1 }) => (
  <g>
    {/* Sombra projetada macia 3D */}
    <text
      x={x}
      y={y + 8}
      textAnchor="middle"
      fontSize={size}
      fontWeight={800}
      fontFamily={FONT_DISPLAY}
      letterSpacing={letterSpacing}
      fill="#1A4B7C"
      stroke="#1A4B7C"
      strokeWidth={whiteBorder}
      strokeLinejoin="round"
      opacity={0.32}
    >
      {text}
    </text>
    {/* Borda branca grossa estilo adesivo vinil */}
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={size}
      fontWeight={800}
      fontFamily={FONT_DISPLAY}
      letterSpacing={letterSpacing}
      fill="#FFFFFF"
      stroke="#FFFFFF"
      strokeWidth={whiteBorder}
      strokeLinejoin="round"
    >
      {text}
    </text>
    {/* Contorno marrom quente + preenchimento vibrante */}
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={size}
      fontWeight={800}
      fontFamily={FONT_DISPLAY}
      letterSpacing={letterSpacing}
      fill={fill}
      stroke={OUTLINE}
      strokeWidth={darkBorder}
      strokeLinejoin="round"
      paintOrder="stroke fill"
    >
      {text}
    </text>
  </g>
);

/** Palavra colorida letra-por-letra estilo arco-íris (ex: "DAS CORES!") */
const RainbowStickerWord: React.FC<{
  text: string;
  cx: number;
  y: number;
  size: number;
  whiteBorder?: number;
  darkBorder?: number;
}> = ({ text, cx, y, size, whiteBorder = 18, darkBorder = 6.5 }) => {
  const letters = text.split("");
  const colors = ["#FF4757", "#FF9F43", "#FFD32A", "#2ED573", "#1E90FF", "#9B59B6"];
  return (
    <g>
      <text
        x={cx}
        y={y + 7}
        textAnchor="middle"
        fontSize={size}
        fontWeight={800}
        fontFamily={FONT_DISPLAY}
        fill="#1A4B7C"
        stroke="#1A4B7C"
        strokeWidth={whiteBorder}
        strokeLinejoin="round"
        opacity={0.3}
      >
        {text}
      </text>
      <text
        x={cx}
        y={y}
        textAnchor="middle"
        fontSize={size}
        fontWeight={800}
        fontFamily={FONT_DISPLAY}
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth={whiteBorder}
        strokeLinejoin="round"
      >
        {text}
      </text>
      <text
        x={cx}
        y={y}
        textAnchor="middle"
        fontSize={size}
        fontWeight={800}
        fontFamily={FONT_DISPLAY}
        stroke={OUTLINE}
        strokeWidth={darkBorder}
        strokeLinejoin="round"
        paintOrder="stroke fill"
      >
        {letters.map((ch, i) => (
          <tspan key={i} fill={ch === " " ? "none" : colors[i % colors.length]}>
            {ch}
          </tspan>
        ))}
      </text>
    </g>
  );
};

// =============================================================================
// 1. LOGO / FOTO DE PERFIL DO CANAL (800 x 800 px — PERFEITO EM CÍRCULO!)
// =============================================================================
export const BrandingLogo: React.FC = () => (
  <AbsoluteFill>
    <svg width={800} height={800} viewBox="0 0 800 800">
      <defs>
        <radialGradient id="logoSky" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FFF7C2" />
          <stop offset="48%" stopColor="#6BD0FF" />
          <stop offset="100%" stopColor="#1B8CEB" />
        </radialGradient>
        <linearGradient id="logoGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5BE884" />
          <stop offset="100%" stopColor="#1FB85C" />
        </linearGradient>
      </defs>

      {/* Fundo radiante com raios de sol */}
      <rect width={800} height={800} fill="url(#logoSky)" />
      <g transform="translate(400, 390)" opacity={0.22}>
        {Array.from({ length: 16 }).map((_, i) => (
          <polygon key={i} points="0,0 -36,-560 36,-560" fill="#FFFFFF" transform={`rotate(${i * 22.5})`} />
        ))}
      </g>

      {/* Arco-Íris enquadrando o topo do círculo */}
      {RAINBOW.map((col, idx) => {
        const r = 345 - idx * 20;
        return (
          <path
            key={idx}
            d={`M ${400 - r} 495 A ${r} ${r} 0 0 1 ${400 + r} 495`}
            fill="none"
            stroke={col}
            strokeWidth={21}
            strokeLinecap="round"
          />
        );
      })}

      {/* Estrelinhas brilhantes */}
      <SparkleStar x={150} y={180} r={18} color="#FFF7AE" />
      <SparkleStar x={655} y={170} r={16} color="#FFFFFF" />
      <SparkleStar x={400} y={98} r={20} color="#FFF7AE" />

      {/* Gramado curvo na base */}
      <ellipse cx={400} cy={690} rx={520} ry={215} fill="url(#logoGrass)" />
      <ProCloud x={105} y={485} scale={0.95} />
      <ProCloud x={695} y={485} scale={0.95} />

      {/* Elenco dos 4 personagens unidos e super expressivos! */}
      <g transform="translate(182, 540) scale(1.16)">
        <LiliV2 frame={14} emotion="happy" action="wave" viseme={0} blink={false} pupilDx={2} pupilDy={0} headNod={-3} uid="logo-lili" />
      </g>
      <g transform="translate(618, 548) scale(1.14) scale(-1, 1)">
        <DinoV2 frame={12} emotion="excited" action="celebrate" viseme={0} blink={false} pupilDx={2} pupilDy={0} headNod={2} uid="logo-dino" />
      </g>
      <g transform="translate(548, 258) scale(0.82) scale(-1, 1)">
        <NinaV2 frame={8} emotion="happy" action="fly_idle" viseme={0} blink={false} pupilDx={1} pupilDy={1} headNod={0} uid="logo-nina" />
      </g>
      {/* TICO protagonista bem grande e carismático no centro! */}
      <g transform="translate(400, 575) scale(1.38)">
        <TicoV2 frame={10} emotion="excited" action="wave" viseme={0} blink={false} pupilDx={0} pupilDy={0} headNod={0} uid="logo-tico" />
      </g>

      {/* Emblema/Faixa inferior super legível mesmo em ícone pequeno */}
      <g transform="translate(0, 12)">
        <StickerText text="TICO & A" x={400} y={626} size={74} fill="#FF4757" whiteBorder={22} darkBorder={8} />
        <RainbowStickerWord text="VILA DAS CORES" cx={400} y={702} size={64} whiteBorder={20} darkBorder={7.5} />
      </g>
    </svg>
  </AbsoluteFill>
);

// =============================================================================
// 2. BANNER DO CANAL YOUTUBE (2560 x 1440 px — SAFE ZONE EXATA 1546 x 423 px!)
//    Safe zone: x = 507..2053, y = 508..932
// =============================================================================
export const BrandingBanner: React.FC = () => (
  <AbsoluteFill>
    <svg width={2560} height={1440} viewBox="0 0 2560 1440">
      <defs>
        <linearGradient id="banSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1FA2FF" />
          <stop offset="52%" stopColor="#82DCFF" />
          <stop offset="100%" stopColor="#FFF5D6" />
        </linearGradient>
        <radialGradient id="banGlow" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stopColor="#FFFBE0" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#FFFBE0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="banHill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86F29F" />
          <stop offset="100%" stopColor="#35D073" />
        </linearGradient>
        <linearGradient id="banHill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3EE07F" />
          <stop offset="100%" stopColor="#1BAE57" />
        </linearGradient>
      </defs>

      {/* Fundo panorâmico completo 2560x1440 (Smart TV + Desktop + Mobile) */}
      <rect width={2560} height={1440} fill="url(#banSky)" />
      <rect width={2560} height={1440} fill="url(#banGlow)" />

      {/* Sunburst suave centralizado */}
      <g transform="translate(1280, 720)" opacity={0.18}>
        {Array.from({ length: 20 }).map((_, i) => (
          <polygon key={i} points="0,0 -55,-1600 55,-1600" fill="#FFFFFF" transform={`rotate(${i * 18})`} />
        ))}
      </g>

      {/* Sol sorridente (visível em TV/Desktop à esquerda) */}
      <g transform="translate(310, 275) scale(1.65)">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={-6} y={-76} width={12} height={22} rx={6} fill="#FFD32A" transform={`rotate(${i * 30})`} />
        ))}
        <circle cx={0} cy={0} r={48} fill="#FFE047" stroke="#F7B731" strokeWidth={4} />
        <circle cx={-14} cy={-6} r={4.5} fill={OUTLINE} />
        <circle cx={14} cy={-6} r={4.5} fill={OUTLINE} />
        <path d="M -14 8 Q 0 22 14 8" fill="none" stroke={OUTLINE} strokeWidth={3.5} strokeLinecap="round" />
      </g>

      {/* Arco-Íris panorâmico gigante atravessando a área segura! */}
      {RAINBOW.map((col, idx) => {
        const r = 790 - idx * 32;
        return (
          <path
            key={idx}
            d={`M ${1280 - r} 1050 A ${r} ${r} 0 0 1 ${1280 + r} 1050`}
            fill="none"
            stroke={col}
            strokeWidth={33}
            strokeLinecap="round"
            opacity={0.93}
          />
        );
      })}

      {/* Nuvens panorâmicas */}
      <ProCloud x={430} y={560} scale={1.55} />
      <ProCloud x={2130} y={550} scale={1.6} />
      <ProCloud x={840} y={240} scale={1.45} opacity={0.82} />
      <ProCloud x={1760} y={220} scale={1.5} opacity={0.82} />

      {/* Colinas e casinhas da Vila (embelezam TV e Desktop) */}
      <ellipse cx={580} cy={1120} rx={960} ry={340} fill="url(#banHill1)" />
      <ellipse cx={2020} cy={1140} rx={980} ry={350} fill="url(#banHill1)" />
      <ProCottage x={285} y={915} wall="#FFF4D8" roof="#FF5C7A" scale={1.55} />
      <ProCottage x={2275} y={920} wall="#E6F5FF" roof="#FFA502" scale={1.6} />

      {/* Gramado principal suave + caminho fofo + flores (enriquece TVs 4K!) */}
      <path d="M 0 920 Q 1280 825 2560 920 L 2560 1440 L 0 1440 Z" fill="url(#banHill2)" />
      <path d="M 780 1440 Q 1280 950 1780 1440 Z" fill="#F8EFBA" opacity={0.62} />
      {[
        { x: 240, y: 1120, c: "#FF4757" },
        { x: 460, y: 1210, c: "#FFD43B" },
        { x: 640, y: 1090, c: "#FF9FF3" },
        { x: 1920, y: 1095, c: "#FF9F43" },
        { x: 2120, y: 1205, c: "#FF4757" },
        { x: 2340, y: 1125, c: "#FFD43B" },
      ].map((fl, i) => (
        <g key={i} transform={`translate(${fl.x}, ${fl.y}) scale(1.6)`}>
          <path d="M 0 0 Q 2 -14 0 -26" fill="none" stroke="#188C46" strokeWidth={4} strokeLinecap="round" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 8} cy={-28 + Math.sin((a * Math.PI) / 180) * 8} r={6} fill={fl.c} />
          ))}
          <circle cx={0} cy={-28} r={5.5} fill="#FFD43B" />
        </g>
      ))}

      {/* ================================================================= */}
      {/* ÁREA SEGURA DO YOUTUBE (x: 507..2053, y: 508..932 — 1546x423 px)  */}
      {/* Todos os 4 personagens + Logo 3D + Slogan vivem aqui com folga!   */}
      {/* ================================================================= */}

      {/* Estrelinhas decorativas na área segura */}
      <SparkleStar x={555} y={565} r={20} color="#FFF7AE" />
      <SparkleStar x={985} y={555} r={16} color="#FFFFFF" />
      <SparkleStar x={1580} y={555} r={16} color="#FFFFFF" />
      <SparkleStar x={2005} y={560} r={20} color="#FFF7AE" />

      {/* Lado Esquerdo da Área Segura: Lili + Tico (com respiro limpo pro título) */}
      <g transform="translate(618, 902) scale(1.22)">
        <LiliV2 frame={14} emotion="happy" action="wave" viseme={0} blink={false} pupilDx={2} pupilDy={0} headNod={-2} uid="ban-lili" />
      </g>
      <g transform="translate(795, 912) scale(1.28)">
        <TicoV2 frame={10} emotion="excited" action="wave" viseme={0} blink={false} pupilDx={2} pupilDy={0} headNod={2} uid="ban-tico" />
      </g>

      {/* Lado Direito da Área Segura: Dino Bip + Dona Coruja Nina */}
      <g transform="translate(1765, 910) scale(1.25) scale(-1, 1)">
        <DinoV2 frame={12} emotion="excited" action="wave" viseme={0} blink={false} pupilDx={2} pupilDy={0} headNod={0} uid="ban-dino" />
      </g>
      <g transform="translate(1955, 785) scale(1.14) scale(-1, 1)">
        <NinaV2 frame={8} emotion="happy" action="fly_idle" viseme={0} blink={false} pupilDx={2} pupilDy={1} headNod={0} uid="ban-nina" />
      </g>

      {/* Centro da Área Segura: Logotipo 3D Hero + Slogan */}
      <g>
        <StickerText text="TICO & A VILA" x={1285} y={662} size={114} fill="#FF4757" whiteBorder={28} darkBorder={9} />
        <RainbowStickerWord text="DAS CORES!" cx={1285} y={768} size={104} whiteBorder={26} darkBorder={8.5} />

        {/* Pill Slogan super legível no celular e na TV */}
        <g transform="translate(1285, 845)">
          <rect x={-355} y={-34} width={710} height={68} rx={34} fill="#FFD43B" stroke="#FFFFFF" strokeWidth={8} />
          <rect x={-355} y={-34} width={710} height={68} rx={34} fill="none" stroke={OUTLINE} strokeWidth={3.5} />
          <text
            x={0}
            y={10}
            textAnchor="middle"
            fontSize={29}
            fontWeight={700}
            fontFamily={FONT_UI}
            fill={OUTLINE}
            letterSpacing={0.5}
          >
            AVENTURAS, CORES E AMIZADE TODOS OS DIAS!
          </text>
        </g>
      </g>
    </svg>
  </AbsoluteFill>
);

// =============================================================================
// 3. MARCA D'ÁGUA DOS VÍDEOS (150 x 150 px PNG TRANSPARENTE)
// =============================================================================
export const BrandingWatermark: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    <svg width={150} height={150} viewBox="0 0 150 150">
      <defs>
        <clipPath id="wmClip">
          <circle cx={75} cy={75} r={60} />
        </clipPath>
      </defs>
      {/* Anel arco-íris externo estilo selo oficial */}
      <circle cx={75} cy={75} r={70} fill="#FFFFFF" stroke="#FF4757" strokeWidth={6} />
      <circle cx={75} cy={75} r={62} fill="#6BD0FF" stroke="#FFD43B" strokeWidth={4} />
      <g clipPath="url(#wmClip)">
        <g transform="translate(75, 198) scale(0.71)">
          <TicoV2 frame={10} emotion="excited" action="idle" viseme={0} blink={false} pupilDx={0} pupilDy={0} headNod={0} uid="wm-tico" />
        </g>
      </g>
    </svg>
  </AbsoluteFill>
);

// =============================================================================
// 4. THUMBNAIL DINÂMICA V3 DE ALTO CTR (1280 x 720 px — ÚNICA PARA CADA EPISÓDIO!)
//    Usa o CENÁRIO GERADO SOB MEDIDA do episódio + poses/expressões dinâmicas + paleta única!
// =============================================================================
export const EpisodeThumb: React.FC<{
  episodeNumber?: number;
  badgeText?: string;
  subText?: string;
  customBgSvg?: string | null;
  accentColor?: string;
  bgTop?: string;
  bgBottom?: string;
}> = ({
  episodeNumber = 1,
  badgeText = "NOVA AVENTURA!",
  subText = "VILA DAS CORES!",
  customBgSvg = null,
  accentColor = "#FF4757",
  bgTop = "#62CFFF",
  bgBottom = "#1B85E5",
}) => {
  // Varia poses, emoções e formação dos personagens a cada episódio (nunca 2 thumbs iguais!)
  const variant = Math.abs((episodeNumber || 1) - 1) % 4;
  const ticoEmotion = variant === 0 ? "surprised" : variant === 1 ? "excited" : variant === 2 ? "laughing" : "happy";
  const liliEmotion = variant === 0 ? "surprised" : variant === 1 ? "happy" : variant === 2 ? "excited" : "laughing";
  const dinoEmotion = variant === 0 ? "excited" : variant === 1 ? "laughing" : variant === 2 ? "surprised" : "excited";
  const showNina = variant === 1 || variant === 3;

  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <defs>
          <radialGradient id="thSkyDyn" cx="62%" cy="44%" r="68%">
            <stop offset="0%" stopColor="#FFF8C9" />
            <stop offset="48%" stopColor={bgTop} />
            <stop offset="100%" stopColor={bgBottom} />
          </radialGradient>
          <linearGradient id="thGrassDyn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#52E582" />
            <stop offset="100%" stopColor="#1BB55B" />
          </linearGradient>
          <linearGradient id="thTopShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D2B52" stopOpacity="0.34" />
            <stop offset="55%" stopColor="#0D2B52" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Fundo EXCLUSIVO do episódio (gerado pelo Diretor de Arte IA) ou gradiente temático */}
        {customBgSvg ? (
          <g>
            <g dangerouslySetInnerHTML={{ __html: customBgSvg }} />
            <rect width={1280} height={340} fill="url(#thTopShade)" />
            {/* Sunburst sutil para pop de CTR */}
            <g transform="translate(860, 320)" opacity={0.14}>
              {Array.from({ length: 16 }).map((_, i) => (
                <polygon key={i} points="0,0 -38,-900 38,-900" fill="#FFFFFF" transform={`rotate(${i * 22.5})`} />
              ))}
            </g>
          </g>
        ) : (
          <g>
            <rect width={1280} height={720} fill="url(#thSkyDyn)" />
            <g transform="translate(830, 340)" opacity={0.22}>
              {Array.from({ length: 18 }).map((_, i) => (
                <polygon key={i} points="0,0 -42,-920 42,-920" fill="#FFFFFF" transform={`rotate(${i * 20})`} />
              ))}
            </g>
            {RAINBOW.map((col, idx) => {
              const r = 415 - idx * 24;
              return (
                <path
                  key={idx}
                  d={`M ${835 - r} 620 A ${r} ${r} 0 0 1 ${835 + r} 620`}
                  fill="none"
                  stroke={col}
                  strokeWidth={25}
                  strokeLinecap="round"
                />
              );
            })}
            <ellipse cx={640} cy={760} rx={920} ry={225} fill="url(#thGrassDyn)" />
            <ProCloud x={1150} y={540} scale={1.1} />
          </g>
        )}

        <SparkleStar x={700} y={295} r={22} color="#FFFFFF" />
        <SparkleStar x={1185} y={270} r={19} color="#FFF7AE" />

        {/* Formação dinâmica dos personagens à esquerda — deixando a metade direita livre para os objetos da história! */}
        {variant % 2 === 0 ? (
          <>
            <g transform="translate(142, 680) scale(1.38)">
              <LiliV2 frame={12} emotion={liliEmotion} action="wave" viseme={0} blink={false} pupilDx={3} pupilDy={-1} headNod={-3} uid="th-lili" />
            </g>
            <g transform="translate(565, 690) scale(1.36) scale(-1, 1)">
              <DinoV2 frame={14} emotion={dinoEmotion} action="jump" viseme={0} blink={false} pupilDx={-2} pupilDy={-1} headNod={2} uid="th-dino" />
            </g>
            <g transform="translate(352, 712) scale(1.66)">
              <TicoV2 frame={10} emotion={ticoEmotion} action="wave" viseme={0} blink={false} pupilDx={3} pupilDy={-2} headNod={0} uid="th-tico" />
            </g>
          </>
        ) : (
          <>
            <g transform="translate(152, 688) scale(1.42)">
              <DinoV2 frame={14} emotion={dinoEmotion} action="celebrate" viseme={0} blink={false} pupilDx={3} pupilDy={-1} headNod={-2} uid="th-dino2" />
            </g>
            <g transform="translate(555, 685) scale(1.36) scale(-1, 1)">
              <LiliV2 frame={12} emotion={liliEmotion} action="wave" viseme={0} blink={false} pupilDx={-2} pupilDy={-1} headNod={3} uid="th-lili2" />
            </g>
            <g transform="translate(356, 712) scale(1.66)">
              <TicoV2 frame={10} emotion={ticoEmotion} action="celebrate" viseme={0} blink={false} pupilDx={3} pupilDy={-1} headNod={1} uid="th-tico2" />
            </g>
            {showNina && (
              <g transform="translate(465, 295) scale(0.92)">
                <NinaV2 frame={8} emotion="excited" action="fly_idle" viseme={0} blink={false} pupilDx={2} pupilDy={1} headNod={0} uid="th-nina" />
              </g>
            )}
          </>
        )}

        {/* Selo EPISÓDIO XX no canto superior esquerdo */}
        <g transform="translate(175, 76)">
          <rect x={-138} y={-40} width={276} height={80} rx={40} fill="#FFD43B" stroke="#FFFFFF" strokeWidth={9} />
          <rect x={-138} y={-40} width={276} height={80} rx={40} fill="none" stroke={OUTLINE} strokeWidth={4} />
          <text x={0} y={14} textAnchor="middle" fontSize={40} fontWeight={800} fontFamily={FONT_DISPLAY} fill={OUTLINE}>
            EPISÓDIO {episodeNumber}
          </text>
        </g>

        {/* Título gigante de alto impacto no topo direito com cor dinâmica */}
        <StickerText text={badgeText} x={885} y={148} size={78} fill={accentColor} whiteBorder={26} darkBorder={8} />
        <RainbowStickerWord text={subText} cx={890} y={236} size={68} whiteBorder={24} darkBorder={7.5} />
      </svg>
    </AbsoluteFill>
  );
};

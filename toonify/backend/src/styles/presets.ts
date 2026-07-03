/**
 * Style presets shown in the app. Each preset maps to provider-specific
 * configuration: a prompt (and optional extra model inputs) for Replicate,
 * and an FFmpeg filter graph for the free local provider.
 *
 * Adding a preset here is all that's needed for it to appear in the app
 * (the app fetches GET /api/styles).
 *
 * The local filter graphs share a common recipe, tuned per style:
 *   1. `bilateral` — edge-preserving smoothing (flattens skin/surfaces into
 *      paint-like patches while keeping outlines sharp; the core cartoon look)
 *   2. color quantization — `lutyuv`/`lutrgb` rounding to fixed bands gives
 *      cel shading. Fixed luts are deterministic per pixel, so unlike
 *      palette-learning filters (elbg) they cannot flicker between frames.
 *   3. ink lines — `edgedetect` -> `negate` -> multiply-blend draws black
 *      outlines over the flat colors (`erosion` passes thicken the strokes)
 *   4. `eq` grade — saturation/contrast push toward the target genre
 */
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  /** Prompt sent to the img2img model for each frame. */
  prompt: string;
  /** Extra model inputs merged into the Replicate request (model-specific). */
  extraInput?: Record<string, unknown>;
  /** FFmpeg filter graph implementing this style for the free local provider. */
  localFilter: string;
}

const inkLines = (low: number, high: number, thicken: string) =>
  `format=gray,edgedetect=low=${low}:high=${high},negate${thicken},format=gbrp`;

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "pixar-3d",
    name: "Pixar 3D",
    description: "Smooth, glowing 3D-render look",
    prompt:
      "3d animated movie style, pixar style render, soft studio lighting, smooth rounded shapes, vibrant colors, high detail",
    localFilter:
      "bilateral=sigmaS=9:sigmaR=0.12,bilateral=sigmaS=9:sigmaR=0.12," +
      "eq=saturation=1.45:contrast=1.12:brightness=0.02,unsharp=5:5:0.8",
  },
  {
    id: "anime",
    name: "Anime",
    description: "Flat cel shading with fine line art",
    prompt:
      "anime style, cel shaded, clean bold line art, flat colors, studio anime key visual, detailed eyes",
    localFilter:
      "bilateral=sigmaS=9:sigmaR=0.14,bilateral=sigmaS=9:sigmaR=0.14,split[base][edges];" +
      "[base]lutyuv=y='round(val/36)*36',eq=saturation=1.55,format=gbrp[flat];" +
      `[edges]${inkLines(0.08, 0.2, "")}[lines];` +
      "[flat][lines]blend=all_mode=multiply,format=yuv420p",
  },
  {
    id: "comic-book",
    name: "Comic Book",
    description: "Bold ink outlines, punchy poster colors",
    prompt:
      "american comic book style, bold black ink outlines, halftone shading, saturated primary colors, dynamic panel art",
    localFilter:
      "bilateral=sigmaS=7:sigmaR=0.1,split[base][edges];" +
      "[base]lutrgb=r='round(val/64)*64':g='round(val/64)*64':b='round(val/64)*64'," +
      "eq=saturation=1.75:contrast=1.2,format=gbrp[flat];" +
      `[edges]${inkLines(0.04, 0.12, ",erosion,erosion")}[lines];` +
      "[flat][lines]blend=all_mode=multiply,format=yuv420p",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft hand-painted washes with paper grain",
    prompt:
      "watercolor painting, soft brush strokes, paper texture, pastel palette, hand painted illustration",
    localFilter:
      "bilateral=sigmaS=12:sigmaR=0.25,bilateral=sigmaS=12:sigmaR=0.25,gblur=sigma=0.8," +
      "eq=saturation=1.15:contrast=0.9:brightness=0.06,noise=alls=8:allf=t+u",
  },
];

export function getPreset(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find((p) => p.id === id);
}

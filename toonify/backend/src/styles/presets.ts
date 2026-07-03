/**
 * Style presets shown in the app. Each preset maps to provider-specific
 * configuration: a prompt (and optional extra model inputs) for Replicate,
 * and an FFmpeg filter chain for the free local mock provider.
 *
 * Adding a preset here is all that's needed for it to appear in the app
 * (the app fetches GET /api/styles).
 */
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  /** Prompt sent to the img2img model for each frame. */
  prompt: string;
  /** Extra model inputs merged into the Replicate request (model-specific). */
  extraInput?: Record<string, unknown>;
  /** FFmpeg filter used by the mock provider to fake this style locally. */
  mockFilter: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "pixar-3d",
    name: "Pixar 3D",
    description: "Soft, rounded 3D animation look",
    prompt:
      "3d animated movie style, pixar style render, soft studio lighting, smooth rounded shapes, vibrant colors, high detail",
    mockFilter: "smartblur=lr=1.5,eq=saturation=1.5:contrast=1.15:brightness=0.03",
  },
  {
    id: "anime",
    name: "Anime",
    description: "Classic Japanese anime cel shading",
    prompt:
      "anime style, cel shaded, clean bold line art, flat colors, studio anime key visual, detailed eyes",
    mockFilter: "median=5,elbg=codebook_length=32,eq=saturation=1.6",
  },
  {
    id: "comic-book",
    name: "Comic Book",
    description: "Inked comic panels with halftone punch",
    prompt:
      "american comic book style, bold black ink outlines, halftone shading, saturated primary colors, dynamic panel art",
    mockFilter: "edgedetect=mode=colormix:high=0.9,eq=saturation=1.8:contrast=1.4",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft hand-painted watercolor washes",
    prompt:
      "watercolor painting, soft brush strokes, paper texture, pastel palette, hand painted illustration",
    mockFilter: "smartblur=lr=2.5,eq=saturation=1.2:contrast=0.95:brightness=0.05",
  },
];

export function getPreset(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find((p) => p.id === id);
}

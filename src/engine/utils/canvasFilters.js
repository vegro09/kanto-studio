// 15 PROFESSIONAL CANVAS & VIDEO/IMAGE VISUAL FILTERS ENGINE

export const VISUAL_FILTERS = [
  { id: 'none', label: 'None (Original)', filter: 'none' },
  { id: 'grayscale', label: 'Grayscale', filter: 'grayscale(100%)' },
  { id: 'sepia', label: 'Sepia Tone', filter: 'sepia(100%)' },
  { id: 'cinematic', label: 'Cinematic Dark', filter: 'contrast(120%) brightness(80%) saturate(80%)' },
  { id: 'warm_sunset', label: 'Warm Sunset', filter: 'sepia(40%) saturate(150%) hue-rotate(-15deg)' },
  { id: 'cool_breeze', label: 'Cool Breeze', filter: 'saturate(80%) hue-rotate(180deg) brightness(110%)' },
  { id: 'high_contrast', label: 'High Contrast', filter: 'contrast(150%)' },
  { id: 'vintage', label: 'Vintage Film', filter: 'sepia(50%) contrast(90%) brightness(110%) blur(0.5px)' },
  { id: 'vibrant', label: 'Vibrant Boost', filter: 'saturate(200%)' },
  { id: 'darken', label: 'Darken Mood', filter: 'brightness(50%)' },
  { id: 'brighten', label: 'Brighten High Key', filter: 'brightness(150%)' },
  { id: 'blur', label: 'Soft Motion Blur', filter: 'blur(8px)' },
  { id: 'invert', label: 'Invert Colors', filter: 'invert(100%)' },
  { id: 'retro80s', label: 'Retro 80s Synth', filter: 'contrast(120%) saturate(150%) hue-rotate(290deg)' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', filter: 'contrast(130%) saturate(200%) hue-rotate(240deg)' },
  { id: 'noir', label: 'Noir Black & White', filter: 'grayscale(100%) contrast(150%) brightness(90%)' }
];

export function getCanvasFilterString(filterStyle) {
  if (!filterStyle || filterStyle === 'none') return 'none';
  const found = VISUAL_FILTERS.find((f) => f.id === filterStyle);
  return found ? found.filter : 'none';
}

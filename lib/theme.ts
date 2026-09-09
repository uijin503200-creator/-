/**
 * Drift color language — midnight blues, charcoal, cold mist.
 * Avoid purple gradients and warm cream palettes.
 */
export const palette = {
  void: '#05070D',
  abyss: '#0A1020',
  midnight: '#0E1A33',
  deep: '#152848',
  mist: '#7A8BA8',
  fog: '#A8B4C8',
  paper: '#E8EEF7',
  pulse: '#3D7EFF',
  pulseSoft: 'rgba(61, 126, 255, 0.35)',
  echo: '#5EC8FF',
  danger: '#C45B6A',
  line: 'rgba(168, 180, 200, 0.12)',
} as const;

export const typography = {
  display: 'CormorantGaramond_400Regular',
  displayItalic: 'CormorantGaramond_400Regular_Italic',
  displayMedium: 'CormorantGaramond_500Medium',
  body: 'Outfit_300Light',
  bodyMedium: 'Outfit_400Regular',
  label: 'Outfit_500Medium',
} as const;
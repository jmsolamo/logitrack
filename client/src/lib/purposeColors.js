// Purpose-based color map for delivery cards and badges
// Maps each delivery purpose to Tailwind classes for consistent color coding

const PURPOSE_COLORS = {
  'Rescue':              { bg: 'bg-[#E84057]/15', border: 'border-[#E84057]/30', text: 'text-foreground', solid: 'bg-[#E84057]' },
  'Pull Out':            { bg: 'bg-[#FF6B6B]/15', border: 'border-[#FF6B6B]/30', text: 'text-foreground', solid: 'bg-[#FF6B6B]' },
  'Delivery':            { bg: 'bg-[#FFA94D]/15', border: 'border-[#FFA94D]/30', text: 'text-foreground', solid: 'bg-[#FFA94D]' },
  'Pick Up':             { bg: 'bg-[#4ECDC4]/15', border: 'border-[#4ECDC4]/30', text: 'text-foreground', solid: 'bg-[#4ECDC4]' },
  'Service Manpower':    { bg: 'bg-[#45B7D1]/15', border: 'border-[#45B7D1]/30', text: 'text-foreground', solid: 'bg-[#45B7D1]' },
  'Assign to Project':   { bg: 'bg-[#45B7D1]/15', border: 'border-[#45B7D1]/30', text: 'text-foreground', solid: 'bg-[#45B7D1]' },
  'Purchase':            { bg: 'bg-[#9B59B6]/15', border: 'border-[#9B59B6]/30', text: 'text-foreground', solid: 'bg-[#9B59B6]' },
};

// Default fallback color (neutral gray)
const DEFAULT_PURPOSE_COLOR = { bg: 'bg-muted/30', border: 'border-border', text: 'text-muted-foreground', solid: 'bg-muted-foreground' };

/**
 * Get color classes for a delivery's purpose.
 * Uses the first purpose in the array if multiple exist.
 * @param {string|string[]} purpose - A single purpose string or array of purposes
 * @returns {{ bg: string, border: string, text: string, solid: string }}
 */
export function getPurposeColor(purpose) {
  const key = Array.isArray(purpose) ? purpose[0] : purpose;
  return PURPOSE_COLORS[key] || DEFAULT_PURPOSE_COLOR;
}

export { PURPOSE_COLORS, DEFAULT_PURPOSE_COLOR };

export const DEFAULT_FALLBACK_IMAGE = '/images/textile.jpg';

export const CRAFT_FALLBACKS: Record<string, string> = {
  paintings: '/images/pahari.jpg',
  ceramics: '/images/bluepottery.jpg',
  textiles: '/images/kasuti.jpg',
  metalcraft: '/images/dhokra.jpg',
  woodcraft: '/images/woodcraft.jpg',
  jewellery: '/images/jewellery.jpg',
  shellcraft: '/images/shellcraft.jpg',
  beedu: '/images/beedu.jpg',
};

export function getFallbackForCraft(traditionOrCategory = ''): string {
  const lower = traditionOrCategory.toLowerCase();
  if (lower.includes('shell')) return '/images/shellcraft.jpg';
  if (lower.includes('beedu') || lower.includes('mat')) return '/images/beedu.jpg';
  if (lower.includes('kasuti') || lower.includes('embroidery') || lower.includes('saree')) return '/images/kasuti.jpg';
  if (lower.includes('paint') || lower.includes('miniature') || lower.includes('pahari')) return '/images/pahari.jpg';
  if (lower.includes('pottery') || lower.includes('ceramic') || lower.includes('blue')) return '/images/bluepottery.jpg';
  if (lower.includes('dhokra') || lower.includes('metal') || lower.includes('brass') || lower.includes('bronze')) return '/images/dhokra.jpg';
  if (lower.includes('wood') || lower.includes('channapatna') || lower.includes('lacquer')) return '/images/woodcraft.jpg';
  if (lower.includes('jewel') || lower.includes('kundan') || lower.includes('meenakari')) return '/images/jewellery.jpg';
  return DEFAULT_FALLBACK_IMAGE;
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = DEFAULT_FALLBACK_IMAGE
) {
  const target = e.currentTarget;
  if (!target.src.endsWith(fallback)) {
    target.onerror = null;
    target.src = fallback;
  }
}

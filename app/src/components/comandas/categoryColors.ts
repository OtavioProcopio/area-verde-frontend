const PALETTE = [
  {
    bar: 'bg-gold-500',
    text: 'text-gold-400',
    chip: 'bg-gold-500/15 text-gold-300 border-gold-500/30',
  },
  {
    bar: 'bg-sky-400',
    text: 'text-sky-300',
    chip: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  },
  {
    bar: 'bg-orange-400',
    text: 'text-orange-300',
    chip: 'bg-orange-400/15 text-orange-300 border-orange-400/30',
  },
  {
    bar: 'bg-fuchsia-400',
    text: 'text-fuchsia-300',
    chip: 'bg-fuchsia-400/15 text-fuchsia-300 border-fuchsia-400/30',
  },
  {
    bar: 'bg-lime-400',
    text: 'text-lime-300',
    chip: 'bg-lime-400/15 text-lime-300 border-lime-400/30',
  },
  {
    bar: 'bg-violet-400',
    text: 'text-violet-300',
    chip: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getCategoryColor(categoryName: string) {
  const index = hashString(categoryName) % PALETTE.length;
  return PALETTE[index];
}

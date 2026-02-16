export const DISCO_COLORS = [
  { name: 'lime', hex: '#A4C400', cssVar: '--metro-color-lime' },
  { name: 'green', hex: '#60A917', cssVar: '--metro-color-green' },
  { name: 'emerald', hex: '#008A00', cssVar: '--metro-color-emerald' },
  { name: 'teal', hex: '#00ABA9', cssVar: '--metro-color-teal' },
  { name: 'cyan', hex: '#1BA1E2', cssVar: '--metro-color-cyan' },
  { name: 'cobalt', hex: '#3E65FF', cssVar: '--metro-color-cobalt' },
  { name: 'indigo', hex: '#6A00FF', cssVar: '--metro-color-indigo' },
  { name: 'violet', hex: '#AA00FF', cssVar: '--metro-color-violet' },
  { name: 'pink', hex: '#F472D0', cssVar: '--metro-color-pink' },
  { name: 'magenta', hex: '#D80073', cssVar: '--metro-color-magenta' },
  { name: 'crimson', hex: '#A20025', cssVar: '--metro-color-crimson' },
  { name: 'red', hex: '#E51400', cssVar: '--metro-color-red' },
  { name: 'orange', hex: '#FA6800', cssVar: '--metro-color-orange' },
  { name: 'amber', hex: '#F0A30A', cssVar: '--metro-color-amber' },
  { name: 'yellow', hex: '#E3C800', cssVar: '--metro-color-yellow' },
  { name: 'brown', hex: '#825A2C', cssVar: '--metro-color-brown' },
  { name: 'olive', hex: '#6D8764', cssVar: '--metro-color-olive' },
  { name: 'steel', hex: '#647687', cssVar: '--metro-color-steel' },
  { name: 'mauve', hex: '#76608A', cssVar: '--metro-color-mauve' },
  { name: 'taupe', hex: '#87794E', cssVar: '--metro-color-taupe' }
];

export const discoColorsByName = DISCO_COLORS.reduce((acc, item) => {
  acc[item.name] = item.hex;
  return acc;
}, {});

export default DISCO_COLORS;

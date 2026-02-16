export const DISCO_COLORS = [
  { name: 'lime', hex: '#A4C400', cssVar: '--disco-color-lime' },
  { name: 'green', hex: '#60A917', cssVar: '--disco-color-green' },
  { name: 'emerald', hex: '#008A00', cssVar: '--disco-color-emerald' },
  { name: 'teal', hex: '#00ABA9', cssVar: '--disco-color-teal' },
  { name: 'cyan', hex: '#1BA1E2', cssVar: '--disco-color-cyan' },
  { name: 'cobalt', hex: '#3E65FF', cssVar: '--disco-color-cobalt' },
  { name: 'indigo', hex: '#6A00FF', cssVar: '--disco-color-indigo' },
  { name: 'violet', hex: '#AA00FF', cssVar: '--disco-color-violet' },
  { name: 'pink', hex: '#F472D0', cssVar: '--disco-color-pink' },
  { name: 'magenta', hex: '#D80073', cssVar: '--disco-color-magenta' },
  { name: 'crimson', hex: '#A20025', cssVar: '--disco-color-crimson' },
  { name: 'red', hex: '#E51400', cssVar: '--disco-color-red' },
  { name: 'orange', hex: '#FA6800', cssVar: '--disco-color-orange' },
  { name: 'amber', hex: '#F0A30A', cssVar: '--disco-color-amber' },
  { name: 'yellow', hex: '#E3C800', cssVar: '--disco-color-yellow' },
  { name: 'brown', hex: '#825A2C', cssVar: '--disco-color-brown' },
  { name: 'olive', hex: '#6D8764', cssVar: '--disco-color-olive' },
  { name: 'steel', hex: '#647687', cssVar: '--disco-color-steel' },
  { name: 'mauve', hex: '#76608A', cssVar: '--disco-color-mauve' },
  { name: 'taupe', hex: '#87794E', cssVar: '--disco-color-taupe' }
];

export const discoColorsByName = DISCO_COLORS.reduce((acc, item) => {
  acc[item.name] = item.hex;
  return acc;
}, {});

export default DISCO_COLORS;

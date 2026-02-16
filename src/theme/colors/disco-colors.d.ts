export interface DiscoColorToken {
  name: string;
  hex: string;
  cssVar: string;
}

export const DISCO_COLORS: DiscoColorToken[];
export const discoColorsByName: Record<string, string>;

export default DISCO_COLORS;

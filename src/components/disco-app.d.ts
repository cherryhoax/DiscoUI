/**
 * DiscoApp — App-level orchestrator
 */

export interface DiscoSplashConfig {
  mode?: 'none' | 'auto' | 'manual';
  color?: string;
  icon?: string | HTMLElement;
  showProgress?: boolean;
  progressColor?: string;
}

export type DiscoAppConfig = {
  accent?: string;
  theme?: 'dark' | 'light' | 'auto';
  font?: string | null;
  icon?: string | HTMLElement | null;
  splash?: DiscoSplashConfig | 'none' | 'auto' | 'manual';
  statusBarColor?: string | null;
  navBarColor?: string | null;
  scale?: string | number | null;
};

export default class DiscoApp {
  constructor(config?: DiscoAppConfig);
  launch(frame: HTMLElement): void;
  static ready(callback: () => void): void;
  setupSplash(): void;
  dismissSplash(): void;
  get background(): 'black' | 'white' | string;
  get foreground(): 'black' | 'white' | string;
  get accent(): string;
  set accent(value: string | null);
  get font(): string;
  set font(value: string | null);
  get theme(): string;
  set theme(value: 'dark' | 'light' | 'auto' | string | null);
  setInsets(insets?: {
    top?: number | string | null;
    right?: number | string | null;
    bottom?: number | string | null;
    left?: number | string | null;
  }): void;
  get scale(): number;
  set scale(value: string | number | null);
  /** Layout width (viewport width divided by scale). */
  get width(): number;
  /** Layout height (viewport height divided by scale). */
  get height(): number;
  /** Perspective depth based on layout width. */
  get perspective(): string;
}

export class DiscoAppDelegate {
  /** Background color. Default: black. */
  static get background(): 'black' | 'white' | string;
  /** Foreground color. Default: white. */
  static get foreground(): 'black' | 'white' | string;
  static get accent(): string;
  static get font(): string;
  static get theme(): string;
  static get scale(): number;
  /** Layout width (viewport width divided by scale). */
  static get width(): number;
  /** Layout height (viewport height divided by scale). */
  static get height(): number;
  /** Perspective depth based on layout width. */
  static get perspective(): string;
}

export type DiscoAppInstance = DiscoApp;

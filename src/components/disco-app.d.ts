/**
 * DiscoApp — App-level orchestrator
 */

export type SplashMode = 'none' | 'auto' | 'manual';

export type DiscoAppConfig = {
  accent?: string;
  theme?: 'dark' | 'light' | 'auto';
  font?: string | null;
  icon?: string | HTMLElement | null;
  splash?: SplashMode;
};

export default class DiscoApp {
  constructor(config?: DiscoAppConfig);
  launch(frame: HTMLElement): void;
  static ready(callback: () => void): void;
}

export type DiscoAppInstance = DiscoApp;

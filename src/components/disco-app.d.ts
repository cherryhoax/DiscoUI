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
};

export default class DiscoApp {
  constructor(config?: DiscoAppConfig);
  launch(frame: HTMLElement): void;
  static ready(callback: () => void): void;
  setupSplash(): void;
  dismissSplash(): void;
}

export type DiscoAppInstance = DiscoApp;

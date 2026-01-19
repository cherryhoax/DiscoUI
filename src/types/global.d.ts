declare module '*.css' {
  const content: string;
  export default content;
}

type DiscoSplashElement = HTMLElement & {
  logoNode?: HTMLElement | null;
  dismiss?: () => void;
};

type DiscoPageElement = HTMLElement & {
  animateIn?: () => Promise<void>;
  animateOut?: () => Promise<void>;
  animationOutDuration?: number;
};

type DiscoFrameElement = HTMLElement & {
  navigate: (page: HTMLElement) => Promise<void>;
  goBack: () => Promise<void>;
};

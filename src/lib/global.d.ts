declare global {
    interface Window {
      google: {
        translate: {
          TranslateElement: new (
            options: {
              pageLanguage: string;
              includedLanguages?: string;
              layout?: unknown;
            },
            container: string
          ) => void;
        };
      };
      googleTranslateElementInit: () => void;
    }
  }

  // global.d.ts
declare module 'hypercore';
declare module 'hyperswarm';
declare module 'hyperbee';

  
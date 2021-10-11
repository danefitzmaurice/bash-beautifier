import { PluginSettings } from './interfaces';

declare module 'atom' {
  // import 'atom';

  /**
   *  ...
   */
  export interface Config {
    get<T extends keyof PluginSettings>(keyPath: T): PluginSettings[T];
  }
}

export {};

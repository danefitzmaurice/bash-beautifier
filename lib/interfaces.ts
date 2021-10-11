export enum IndentType {
  Tab = 'tab',
  Space = 'space'
}

export interface PluginSettings {
  /**
   *  ...
   */
  'bash-beautifier.formatOnSave': boolean;
  /**
   *  ...
   */
  'bash-beautifier.indentSize': number;
  /**
   *  ...
   */
  'bash-beautifier.indentType': IndentType;
  /**
   *  ...
   */
  'bash-beautifier.backup': boolean;
}

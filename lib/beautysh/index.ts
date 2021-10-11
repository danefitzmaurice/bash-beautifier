import Beautifier from './beautifier';

export function format(code: string) {
  return new Beautifier().beautify(code);
}

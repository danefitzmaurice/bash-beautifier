import { EventEmitter } from 'events';

import { Snippet } from './snippet';

/** ... */
const HEREDOC_START_REGEX = /.*<<-?\s*['|"]?([_|\w]+)['|"]?.*/;
/** ... */
const FUNCTION_STYLE_REGEX = [
  /\bfunction\s+(\w*)\s*\(\s*\)\s*/,
  /\bfunction\s+(\w*)\s*/,
  /\b\s*(\w*)\s*\(\s*\)\s*/
];
/** ... */
const FUNCTION_STYLE_REPLACEMENT = [
  /function \g<1>() /,
  /function \g<1> /,
  /\g<1>() /
];

/**
 * Takes the given Bash source code line and simplifies it by removing stuff
 * that is not useful for the purpose of indentation level calculation.
 *
 * @param sourceLine ...
 * @returns ...
 */
function getTestRecord(sourceLine: Snippet) {
  return (
    sourceLine
      // collapse multiple quotes between ' ... '
      .replace(/'.*?'/, '')
      // collapse multiple quotes between " ... "
      .replace(/".*?"/, '')
      // collapse multiple quotes between ` ... `
      .replace(/`.*?`/, '')
      // collapse multiple quotes between \` ... ' (weird case)
      .replace(/\\`.*?'`/, '')
      // strip out any escaped single characters
      .replace(/\\./, '')
      // remove '#' comments
      .replace(/(^|\s)(#.*)/, '', 1)
  );
}

/**
 * Returns the index for the function declaration style detected in the given
 * string or null if no function declarations are detected.
 *
 * @param testRecord ...
 * @returns ...
 */
function detectFunctionStyle(testRecord: Snippet) {
  // IMPORTANT: apply regex sequentially and stop on the first match:
  return (
    FUNCTION_STYLE_REGEX.findIndex((regex) => regex.test(testRecord.src)) ||
    null
  );
}

/**
 * ...
 */
export class FormatInstanceWorker extends EventEmitter {
  readonly indentSize: number = atom.config.get('bash-beautifier.indentSize');
  readonly indentType: string = atom.config.get('bash-beautifier.indentType');
  readonly backup: boolean = atom.config.get('bash-beautifier.backup');
  // readonly applyFunctionStyle = atom.config.get('bash-beautifier.applyFunctionStyle');
  readonly applyFunctionStyle: number | null = null;

  tab = 0;
  caseLevel = 0;
  continueLine = false;
  openBrackets = 0;
  inHereDoc = false;
  deferExtQuote = false;
  inExtQuote = false;
  extQuoteString = '';
  hereString = '';
  line = 1;
  formatter = true;
  lines: string[] = [];

  get indentChar() {
    return this.indentType === 'tab' ? '\t' : ' ';
  }

  get output() {
    return this.lines.join('\n');
  }

  constructor() {
    super();

    this.on('line-end', this.onLineEnd);
  }

  /**
   * ...
   *
   * @param data ...
   * @param path ...
   * @return ...
   */
  static apply(data: string, path = '') {
    const worker = new FormatInstanceWorker();

    for (let line of data.split('\n')) {
      worker.processLine(line);
    }

    if (worker.tab !== 0) {
      console.error(
        `File ${path}: error: indent/outdent mismatch: ${worker.tab}.\n`
      );
    }

    return worker.output;
  }

  /**
   * ...
   *
   * @param input ...
   * @return ...
   */
  processLine(input: string) {
    //
    const line = input.replace(/ +?$/, '');
    //
    let sr = new Snippet(line.trim());

    // preserve blank lines
    if (!sr.src) {
      // console.log('Break; Preserve blank lines');

      // Don't allow more then 1 blank line in a row in the output.
      if (this.lines[this.lines.length - 1] !== sr.src) {
        this.write(sr.src);
      }

      return;
    }

    // ensure space before ;; terminators in case statements
    if (this.caseLevel) {
      sr = sr.replace(/(\S);;/g, '$1 ;;');
    }

    let tr = getTestRecord(sr);

    // pass on with no changes
    if (this.inHereDoc) {
      this.write(line);

      // now test for here-doc termination string
      if (tr.contains(this.hereString) && !tr.contains(/<</)) {
        this.inHereDoc = false;
      }

      // console.log('Break; in here-doc.');

      return this.emit('line-end', sr, tr);
    }

    // not in here doc

    if (tr.contains(/<<-?/) && !tr.contains(/done.*<<</)) {
      this.hereString = sr.replace(HEREDOC_START_REGEX, '$1', 1).src;

      this.inHereDoc = this.hereString.length > 0;
    }

    if (this.inExtQuote && tr.contains(this.extQuoteString)) {
      // provide this.line after quotes
      tr = tr.replace(`.*${this.extQuoteString}s(.*)`, '$1', 1);

      this.inExtQuote = false;
    } else if (!this.inExtQuote && tr.contains(/(^|\s)('|")/)) {
      // apply only after this line has been processed
      this.deferExtQuote = true;
      this.extQuoteString = tr.replace(/.*(['"]).*/, '$1', 1).src;

      // provide this.line before quote
      tr = tr.replace(`(.*)${this.extQuoteString}s.*`, '$1', 1);
    }

    if (this.inExtQuote || !this.formatter) {
      // pass on unchanged
      this.write(line);

      if (sr.contains(/#\s*@this.formatter:on/)) {
        this.formatter = true;

        // console.log('Break; in exit quote && formatter:on.');

        return;
      }

      if (this.deferExtQuote) {
        this.inExtQuote = true;
        this.deferExtQuote = false;
      }

      // console.log('Break; in exit quote.');

      return this.emit('line-end', sr, tr);
    }

    // not in ext quote
    if (sr.contains(/#\s*@this.formatter:off/g)) {
      this.formatter = false;
      this.write(line);

      // console.log('Break; NOT in exit quote && formatter:off.');

      return;
    }

    // multi-this.line conditions are often meticulously formatted

    if (this.openBrackets) {
      this.write(line);

      if (this.deferExtQuote) {
        this.inExtQuote = true;
        this.deferExtQuote = false;
      }

      // console.log('Break; open brackets.');

      return this.emit('line-end', sr, tr);
    }

    let inc =
      tr.occurrences(/(\s|^|;)(case|then|do)(;|$|\s)/) +
      tr.occurrences(/(\{|\(|\[)/);

    let outc =
      tr.occurrences(/(\s|^|;)(esac|fi|done|elif)(;|\)|\||$|\s)/) +
      tr.occurrences(/(\}|\)|\])/);

    if (tr.contains(/\besac\b/g)) {
      if (this.caseLevel == 0) {
        throw new Error(`"esac" before "case" in this.line ${this.line}.`);
      }

      outc += 1;
      this.caseLevel -= 1;
    }

    // special handling for bad syntax within case ... esac
    if (tr.contains(/\bcase\b/)) {
      inc += 1;
      this.caseLevel += 1;
    }

    let choiceCase = 0;

    if (this.caseLevel && tr.contains(/^[^(]*\)/)) {
      inc += 1;
      choiceCase = -1;
    }

    // detect functions
    const funcDeclStyle = detectFunctionStyle(tr);

    if (funcDeclStyle !== null) {
      sr = this.changeFunctionStyle(sr, funcDeclStyle);
    }

    // an ad-hoc solution for the "else" keyword
    const elseCase = tr.contains(/^(else|elif)/) ? -1 : 0;

    const net = inc - outc;

    this.tab += Math.min(net, 0);

    // while 'tab' is preserved across multiple lines, 'extab' is not and is
    // used for some adjustments:
    let extab = this.tab + elseCase + choiceCase;

    if (this.continueLine && !this.openBrackets) {
      extab++;
    }

    extab = Math.max(0, extab);

    this.write(this.indentChar.repeat(this.indentSize * extab) + sr.src);

    this.tab += Math.max(net, 0);

    if (this.deferExtQuote) {
      this.inExtQuote = true;
      this.deferExtQuote = false;
    }

    this.emit('line-end', sr, tr);
  }

  /**
   * Converts a function definition syntax from the 'func_decl_style' to the one
   * that has been set in self.apply_function_style and returns the string with
   * the converted syntax.
   *
   * @param strippedRecord ...
   * @param funcDeclStyle ...
   * @returns ...
   */
  private changeFunctionStyle(strippedRecord: Snippet, funcDeclStyle: number) {
    if (funcDeclStyle === null) return strippedRecord;

    if (this.applyFunctionStyle === null) {
      // user does not want to enforce any specific function style
      return strippedRecord;
    }

    const regex = FUNCTION_STYLE_REGEX[funcDeclStyle];
    const replacement = FUNCTION_STYLE_REPLACEMENT[this.applyFunctionStyle];

    return strippedRecord.replace(regex, replacement).strip();
  }

  /**
   * ...
   *
   * @param data
   * @return
   */
  private write(data: string) {
    this.lines.push(data);
  }

  /**
   * ...
   *
   * @param /[/g
   * @return
   */
  private onLineEnd = (strippedRecord: Snippet, testRecord: Snippet) => {
    // count open brackets for this.line continuation
    this.openBrackets += testRecord.occurrences(/\[/g);
    this.openBrackets -= testRecord.occurrences(/\]/g);
    this.continueLine = strippedRecord.contains(/\\$/g);

    this.line++;
  };
}

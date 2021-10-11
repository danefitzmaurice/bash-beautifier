process.env.BEAUT = true;

import Record from './record';

export default class Beautifier {
  constructor(options = {}) {
    // readonly indentSize: number = atom.config.get('bash-beautifier.indentSize');
    // readonly indentType: string = atom.config.get('bash-beautifier.indentType');
    // readonly backup: boolean = atom.config.get('bash-beautifier.backup');

    if (options.indentWithTabs) {
      this.tabSize = 1;
      this.tabStr = '\t';
    } else {
      this.tabSize = options.indentSize || 2;
      this.tabStr = ' ';
    }
  }

  _append(...values) {
    this.output.push(...values);
  }

  _log(...args) {
    if (process.env.BEAUT) console.log('[beautysh:Beautifier]', ...args);
  }

  _formatLine(input = '') {
    input = input.replace(/ +?$/, '');

    const record = {
      stripped: null,
      test: null
    };

    const sr = new Record(input.trim());
    record.stripped = sr;

    // preserve blank lines
    if (!sr.value) {
      this._log('Break; Preserve blank lines');

      // Don't allow more then 1 blank line in a row in the output.
      if (this.output[this.output.length - 1] !== sr.value) {
        this._append(sr.value);
      }

      return;
    }

    // ensure space before ;; terminators in case statements
    if (this.caseLevel) sr.replace(/(\S);;/g, '$1 ;;');

    const tr = new Record(sr);
    record.test = tr;

    tr
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
      .replace(/(^|\s)(#.*)/, '', 1);

    // pass on with no changes
    if (this.inHereDoc) {
      this._append(input);

      // now test for here-doc termination string
      if (tr.contains(this.hereString) && !tr.contains(/<</)) {
        this.inHereDoc = false;
      }

      this._log('Break; in here-doc.');

      return record;
    }

    // not in here doc

    if (tr.contains(/<<-?/) && !tr.contains(/done.*<<</)) {
      this.hereString = new Record(sr).replace(
        /.*<<-?\s*['|"]?([_|\w]+)['|"]?.*/,
        '$1',
        1
      ).value;

      this.inHereDoc = this.hereString.length > 0;
    }

    if (this.inExtQuote && tr.contains(this.extQuoteString)) {
      // provide this.line after quotes
      tr.replace(`.*${this.extQuoteString}s(.*)`, '$1', 1);

      this.inExtQuote = false;
    } else if (!this.inExtQuote && tr.contains(/(^|\s)('|")/)) {
      // apply only after this line has been processed
      this.deferExtQuote = true;
      this.extQuoteString = new Record(tr).replace(/.*(['"]).*/, '$1', 1).value;

      // provide this.line before quote
      tr.replace(`(.*)${this.extQuoteString}s.*`, '$1', 1);
    }

    if (this.inExtQuote || !this.formatter) {
      // pass on unchanged
      this._append(input);

      if (sr.contains(/#\s*@this.formatter:on/)) {
        this.formatter = true;

        this._log('Break; in exit quote && formatter:on.');

        return;
      }

      if (this.deferExtQuote) {
        this.inExtQuote = true;
        this.deferExtQuote = false;
      }

      this._log('Break; in exit quote.');

      return record;
    }

    // not in ext quote

    if (sr.contains(/#\s*@this.formatter:off/)) {
      this.formatter = false;
      this._append(input);

      this._log('Break; NOT in exit quote && formatter:off.');

      return;
    }

    // multi-this.line conditions are often meticulously formatted
    if (this.openBrackets) {
      this._append(input);

      if (this.deferExtQuote) {
        this.inExtQuote = true;
        this.deferExtQuote = false;
      }

      this._log('Break; open brackets.');

      return record;
    }

    let inc =
      tr.matchCount(/(\s|^|;)(case|then|do)(;|$|\s)/) +
      tr.matchCount(/(\{|\(|\[)/);

    let outc =
      tr.matchCount(/(\s|^|;)(esac|fi|done|elif)(;|\)|\||$|\s)/) +
      tr.matchCount(/(\}|\)|\])/);

    if (tr.contains(/\besac\b/)) {
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

    // an ad-hoc solution for the "else" keyword
    const elseCase = tr.contains(/^(else|elif)/) ? -1 : 0;

    const net = inc - outc;

    this.tab += Math.min(net, 0);

    let extab =
      this.tab +
      elseCase +
      choiceCase +
      (this.continueLine && !this.openBrackets ? 1 : 0);

    extab = Math.max(0, extab);

    this._append(this.tabStr.repeat(this.tabSize * extab) + sr.value);

    this.tab += Math.max(net, 0);

    if (this.deferExtQuote) {
      this.inExtQuote = true;
      this.deferExtQuote = false;
    }

    this._log('No Break.');

    return record;
  }

  beautify(code) {
    console.log('beautify statrt -- \n\n');

    this.tab = 0;
    this.caseLevel = 0;
    this.continueLine = false;
    this.openBrackets = 0;
    this.inHereDoc = false;
    this.deferExtQuote = false;
    this.inExtQuote = false;
    this.extQuoteString = '';
    this.hereString = '';
    this.output = [];
    this.line = 1;
    this.formatter = true;

    for (const line of code.split('\n')) {
      const record = this._formatLine(line);

      if (!record) continue;

      // count open brackets for this.line continuation
      this.openBrackets += record.test.matchCount(/\[/);
      this.openBrackets -= record.test.matchCount(/\]/);
      this.continueLine = record.stripped.contains(/\\$/);

      this.line++;
    }

    // console.log(this.output.join('\n'));

    if (this.tab !== 0) {
      throw new Error(`indent/outdent mismatch: ${this.tab}.`);
    }

    return this.output.join('\n');
  }
}

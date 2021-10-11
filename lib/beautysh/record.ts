'use babel';

function ensureValidRegex(pattern) {
  return new RegExp(pattern, 'g');
}

export default class Record {
  get value() {
    return this._value;
  }

  constructor(param) {
    if (param instanceof Record) {
      this._value = param.value || '';
    } else if (typeof param == 'string') {
      this._value = param;
    } else {
      this._value = '';
    }
  }

  static substitute(record, pattern, replacement, count = 0) {
    const regex = ensureValidRegex(pattern);

    let i = 0;

    const iteratee =
      typeof count != 'number' || count <= 0
        ? replacement
        : (substr) =>
            i++ < count ? substr.replace(regex, replacement) : substr;

    return record.value.replace(regex, iteratee);
  }

  replace(pattern, replacement, count = 0) {
    this._value = Record.substitute(this, pattern, replacement, count);

    return this;
  }

  matchCount(pattern) {
    const regex = ensureValidRegex(pattern);

    return (this._value.match(regex) || []).length;
  }

  contains(...patterns) {
    return patterns.every((p) => ensureValidRegex(p).test(this._value));
  }
}

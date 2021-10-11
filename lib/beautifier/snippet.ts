function ensureValidRegex(pattern: string | RegExp) {
  return new RegExp(pattern, 'g');
}

function substitute(
  snippet: Snippet,
  pattern: string | RegExp,
  replacement: string,
  count = 0
) {
  const regex = ensureValidRegex(pattern);

  let i = 0;

  const iteratee =
    typeof count !== 'number' || count <= 0
      ? replacement
      : (substr) => (i++ < count ? substr.replace(regex, replacement) : substr);

  return snippet.src.replace(regex, iteratee);
}

/**
 *  ...
 */
export class Snippet {
  get src() {
    return this.source;
  }

  constructor(private source: string) {}

  /**
   *  ...
   */
  occurrences(pattern: RegExp) {
    // return this.source.match(pattern)?.length ?? 0;
    const regex = ensureValidRegex(pattern);

    return (this.src.match(regex) || []).length;
  }

  /**
   *  ...
   */
  contains(pattern: string | RegExp) {
    return ensureValidRegex(pattern).test(this.src);
  }

  /**
   *  ...
   */
  replace(
    searchValue: string | RegExp,
    replaceValue: string | Snippet,
    count = 0
  ) {
    replaceValue =
      typeof replaceValue === 'string' ? replaceValue : replaceValue.src;

    return new Snippet(substitute(this, searchValue, replaceValue, count));
  }

  strip() {
    return new Snippet(this.source.trim());
  }

  /**
   *  ...
   */
  clone() {
    return new Snippet(this.source);
  }
}

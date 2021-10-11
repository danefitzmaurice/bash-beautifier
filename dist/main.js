// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"beautifier/snippet.ts":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Snippet = void 0;
/**
 *  ...
 */
var Snippet = /** @class */ (function () {
    function Snippet(source) {
        this.source = source;
    }
    Object.defineProperty(Snippet.prototype, "src", {
        get: function () {
            return this.source;
        },
        enumerable: false,
        configurable: true
    });
    /**
     *  ...
     */
    Snippet.prototype.occurrences = function (pattern) {
        var _a, _b;
        return (_b = (_a = this.source.match(pattern)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    };
    /**
     *  ...
     */
    Snippet.prototype.contains = function (pattern) {
        return pattern instanceof RegExp
            ? pattern.test(this.source)
            : this.source.includes(pattern);
    };
    /**
     *  ...
     */
    Snippet.prototype.replace = function (searchValue, replaceValue) {
        replaceValue =
            typeof replaceValue === 'string' ? replaceValue : replaceValue.src;
        return new Snippet(this.source.replace(searchValue, replaceValue));
    };
    /**
     *  ...
     */
    Snippet.prototype.sub = function (searchValue, replaceValue, count) {
        if (count === void 0) { count = 0; }
        replaceValue =
            typeof replaceValue === 'string' ? replaceValue : replaceValue.src;
        return new Snippet(this.source.replace(searchValue, replaceValue));
    };
    Snippet.prototype.strip = function () {
        return new Snippet(this.source.trim());
    };
    /**
     *  ...
     */
    Snippet.prototype.clone = function () {
        return new Snippet(this.source);
    };
    return Snippet;
}());
exports.Snippet = Snippet;

},{}],"beautifier/format-instance-worker.ts":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatInstanceWorker = void 0;
var tslib_1 = require("tslib");
var events_1 = require("events");
var snippet_1 = require("./snippet");
var HEREDOC_START_REGEX = /.*<<-?\s*[\'|"]?([_|\w]+)[\'|"]?.*/;
var FUNCTION_STYLE_REGEX = [
    /\bfunction\s+(\w*)\s*\(\s*\)\s*/,
    /\bfunction\s+(\w*)\s*/,
    /\b\s*(\w*)\s*\(\s*\)\s*/
];
var FUNCTION_STYLE_REPLACEMENT = [
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
function getTestRecord(sourceLine) {
    return (sourceLine
        // collapse multiple quotes between ' ... '
        .sub(/'.*?'/g, '')
        // collapse multiple quotes between " ... "
        .sub(/".*?"/g, '')
        // collapse multiple quotes between ` ... `
        .sub(/`.*?`/g, '')
        // collapse multiple quotes between \` ... ' (weird case)
        .sub(/\\`.*?'`/g, '')
        // strip out any escaped single characters
        .sub(/\\./g, '')
        // remove '#' comments
        .sub(/(^|\s)(#.*)/, '', 1));
}
/**
 * Returns the index for the function declaration style detected in the given
 * string or null if no function declarations are detected.
 *
 * @param testRecord ...
 * @returns ...
 */
function detectFunctionStyle(testRecord) {
    // IMPORTANT: apply regex sequentially and stop on the first match:
    return (FUNCTION_STYLE_REGEX.findIndex(function (regex) { return regex.test(testRecord.src); }) ||
        null);
}
var FormatInstanceWorker = /** @class */ (function (_super) {
    tslib_1.__extends(FormatInstanceWorker, _super);
    function FormatInstanceWorker() {
        var _this = _super.call(this) || this;
        _this.indentSize = atom.config.get('shell-script-beautifier.indentSize');
        _this.indentType = atom.config.get('shell-script-beautifier.indentType');
        _this.backup = atom.config.get('shell-script-beautifier.backup');
        // readonly applyFunctionStyle = atom.config.get('shell-script-beautifier.applyFunctionStyle');
        _this.applyFunctionStyle = null;
        _this.tab = 0;
        _this.caseLevel = 0;
        _this.continueLine = false;
        _this.openBrackets = 0;
        _this.inHereDoc = false;
        _this.deferExtQuote = false;
        _this.inExtQuote = false;
        _this.extQuoteString = '';
        _this.hereString = '';
        _this.line = 1;
        _this.formatter = true;
        _this.lines = [];
        _this.onLineEnd = function (strippedRecord, testRecord) {
            // count open brackets for this.line continuation
            _this.openBrackets += testRecord.occurrences(/\[/g);
            _this.openBrackets -= testRecord.occurrences(/\]/g);
            _this.continueLine = strippedRecord.contains(/\\$/g);
            _this.line++;
        };
        _this.on('line-end', _this.onLineEnd);
        return _this;
    }
    Object.defineProperty(FormatInstanceWorker.prototype, "output", {
        get: function () {
            return this.lines.join('\n');
        },
        enumerable: false,
        configurable: true
    });
    FormatInstanceWorker.apply = function (data, path) {
        if (path === void 0) { path = ''; }
        var worker = new FormatInstanceWorker();
        for (var _i = 0, _a = data.split('\n'); _i < _a.length; _i++) {
            var line = _a[_i];
            worker.processLine(line);
        }
        if (worker.tab !== 0) {
            console.error("File " + path + ": error: indent/outdent mismatch: " + worker.tab + ".\n");
        }
        return worker.output;
    };
    FormatInstanceWorker.prototype.processLine = function (input) {
        //
        var line = input.replace(/ +?$/, '');
        //
        var stripped = new snippet_1.Snippet(line.trim());
        // preserve blank lines
        if (!stripped.src) {
            this.write(stripped.src);
            console.log('outat', 1);
            return;
        }
        // ensure space before ;; terminators in case statements
        if (this.caseLevel) {
            // stripped = utils.sub(r'(\S);;', r'\1 ;;', stripped)
            stripped = stripped.replace(/(\S);;/g, '\\1 ;;');
        }
        var test = getTestRecord(stripped);
        // pass on with no changes
        if (this.inHereDoc) {
            this.write(line);
            // now test for here-doc termination string
            if (test.contains(this.hereString) && !test.contains(/<</)) {
                this.inHereDoc = false;
            }
            return this.emit('line-end', stripped, test);
        }
        // not in here doc
        if (test.contains(/<<-?/) && !test.contains(/done.*<<</)) {
            this.hereString = stripped.sub(HEREDOC_START_REGEX, '\\1', 1).src;
            this.inHereDoc = this.hereString.length > 0;
        }
        if (!this.inExtQuote && test.contains(/(^|\s)(\'|")/g)) {
            // apply only after this line has been processed
            this.deferExtQuote = true;
            this.extQuoteString = test.sub(/.*([\'"]).*/g, '\\1', 1).src;
            // provide this.line before quote
            test = test.sub(new RegExp("(.*)" + this.extQuoteString + "s.*"), '\\1', 1);
        }
        if (this.inExtQuote && test.contains(this.extQuoteString)) {
            // provide this.line after quotes
            test = test.sub(new RegExp(".*" + this.extQuoteString + "s(.*)"), '\\1', 1);
            this.inExtQuote = false;
        }
        if (this.inExtQuote || !this.formatter) {
            // pass on unchanged
            this.write(line);
            if (stripped.contains(/#\s*@this.formatter:on/g)) {
                this.formatter = true;
                return;
            }
            return this.emit('line-end', stripped, test);
        }
        // not in ext quote
        if (stripped.contains(/#\s*@this.formatter:off/g)) {
            this.formatter = false;
            this.write(line);
            return;
        }
        // multi-this.line conditions are often meticulously formatted
        if (this.openBrackets) {
            this.write(line);
            if (this.deferExtQuote) {
                this.inExtQuote = true;
                this.deferExtQuote = false;
            }
            return this.emit('line-end', stripped, test);
        }
        var inc = test.occurrences(/(\s|^|;)(case|then|do)(;|$|\s)/g);
        inc += test.occurrences(/(\{|\(|\[)/g);
        var outc = test.occurrences(/(\s|^|;)(esac|fi|done|elif)(;|\)|\||$|\s)/g);
        outc += test.occurrences(/(\}|\)|\])/g);
        if (test.contains(/\besac\b/g)) {
            if (this.caseLevel == 0) {
                throw new Error("File " + path + ": error: \"esac\" before \"case\" in this.line " + this.line + ".\n");
            }
            outc += 1;
            this.caseLevel -= 1;
        }
        // special handling for bad syntax within case ... esac
        if (test.contains(/\bcase\b/g)) {
            inc += 1;
            this.caseLevel += 1;
        }
        var choiceCase = 0;
        if (this.caseLevel && test.contains(/^[^(]*\)/g)) {
            inc += 1;
            choiceCase = -1;
        }
        // detect functions
        var funcDeclStyle = detectFunctionStyle(test);
        if (funcDeclStyle !== null) {
            stripped = this.changeFunctionStyle(stripped, funcDeclStyle);
        }
        // an ad-hoc solution for the "else" keyword
        var elseCase = !test.contains(/^(else|elif)/) ? 0 : -1;
        var net = inc - outc;
        this.tab += Math.min(net, 0);
        // while 'tab' is preserved across multiple lines, 'extab' is not and is
        // used for some adjustments:
        var extab = this.tab + elseCase + choiceCase;
        if (this.continueLine && !this.openBrackets) {
            extab++;
        }
        extab = Math.max(0, extab);
        this.write(this.indentType.repeat(this.indentSize * extab) + stripped);
        this.tab += Math.max(net, 0);
        if (this.deferExtQuote) {
            this.inExtQuote = true;
            this.deferExtQuote = false;
        }
        this.emit('line-end', stripped, test);
    };
    /**
     * Converts a function definition syntax from the 'func_decl_style' to the one
     * that has been set in self.apply_function_style and returns the string with
     * the converted syntax.
     *
     * @param strippedRecord ...
     * @param funcDeclStyle ...
     * @returns ...
     */
    FormatInstanceWorker.prototype.changeFunctionStyle = function (strippedRecord, funcDeclStyle) {
        if (funcDeclStyle === null)
            return strippedRecord;
        if (this.applyFunctionStyle === null) {
            // user does not want to enforce any specific function style
            return strippedRecord;
        }
        var regex = FUNCTION_STYLE_REGEX[funcDeclStyle];
        var replacement = FUNCTION_STYLE_REPLACEMENT[this.applyFunctionStyle];
        return strippedRecord.sub(regex, replacement).strip();
    };
    FormatInstanceWorker.prototype.write = function (data) {
        this.lines.push(data);
    };
    return FormatInstanceWorker;
}(events_1.EventEmitter));
exports.FormatInstanceWorker = FormatInstanceWorker;

},{"./snippet":"beautifier/snippet.ts"}],"beautifier/index.ts":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = void 0;
var format_instance_worker_1 = require("./format-instance-worker");
/**
 * ...
 *
 * @param data ...
 * @param path ...
 * @returns ...
 */
function format(data, path) {
    if (path === void 0) { path = ''; }
    return format_instance_worker_1.FormatInstanceWorker.apply(data, path);
}
exports.format = format;
// function init() {
//   let errors = [];
//
//   const parser = argparse.ArgumentParser({
//     description: 'A Bash beautifier for the masses'
//   });
//
//   // parser.addArgument()
//
//   //                                              " masses")
//   // parser.add_argument('--indent-size', '-i', nargs=1, type=int, default=4,
//   //                     help="Sets the number of spaces to be used in "
//   //                          "indentation.")
//   // parser.add_argument('--files', '-f', nargs='*',
//   //                     help="Files to be beautified.")
//   // parser.add_argument('--backup', '-b', action='store_true',
//   //                     help="Beautysh will create a backup file in the "
//   //                          "same path as the original.")
//   // parser.add_argument('--this.tab', '-t', action='store_true',
//   //                     help="Sets indentation to tabs instead of spaces")
//   // args = parser.parse_args()
//
//   args = parser.parseArgs();
//
//   if (process.env.argv.length < 2) {
//     // parser.print_help()
//     return;
//   }
//
//   if (Array.isArray(args.indentSize)) {
//     args.indentSize = args.indentSize[0];
//     this.tabSize = args.indentSize;
//     this.backup = args.backup;
//   }
//
//   if (args.this.tab) {
//     this.tabSize = 1;
//     this.tabStr = '\t';
//   }
//
//   for (let pth of args.files) {
//     try {
//       this.beautifyFile(pth);
//     } catch (err) {
//       errors.push(err);
//     }
//   }
//
//   console.log('Process finished!');
//
//   if (errors.length) {
//     console.log(`Errors:\n`, ...errors);
//   }
// }
// beautifyFile(path) {
//   let error = false;
//
//   if (path == '-') {
//     logr('Path is dash');
//
//     let data = process.stdin.read();
//
//     let result,
//       error = this.beautifyString(data, '(stdin)');
//     process.stdout.write(result);
//   } else {
//     // named file
//     logr('Path is not dash');
//
//     let data = this.readFile(path);
//     let result,
//       error = this.beautifyString(data, path);
//
//     logr(result);
//
//     if (data != result) {
//       logr('data != result');
//
//       if (this.backup) {
//         logr('this.backup');
//         logr(path);
//
//         this.writeFile(path + '.bak', data);
//       }
//
//       this.writeFile(path, result);
//     }
//   }
//
//   return error;
// }

},{"./format-instance-worker":"beautifier/format-instance-worker.ts"}],"settings.ts":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settings = void 0;
exports.settings = {
    formatOnSave: {
        title: 'Format Files on Save',
        description: 'Automatically format entire file when saving.',
        type: 'boolean',
        default: false,
        order: 1
    },
    indentSize: {
        title: 'Indent Size',
        description: 'Number of spaces used to represent an indentation.',
        type: 'number',
        default: 2,
        order: 2
    },
    indentType: {
        title: 'Indent Type',
        description: 'Determine chracter used for indentation.',
        type: 'string',
        enum: ['tab', 'space'],
        default: 'tab',
        order: 3
    },
    backup: {
        title: 'Backup',
        description: 'Beautysh will create a backup file in the same path as the original.',
        type: 'boolean',
        default: false,
        order: 4
    }
};

},{}],"main.ts":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.config = void 0;
var atom_1 = require("atom");
var beautifier_1 = require("./beautifier");
var subscriptions = new atom_1.CompositeDisposable();
function formatEditorText(editor) {
    editor = editor || atom.workspace.getActiveTextEditor();
    if (!editor)
        return;
    editor.setText(beautifier_1.format(editor.getText()));
}
function onNewEditor(editor) {
    subscriptions.add(editor.getBuffer().onWillSave(function () { return formatEditorText(editor); }));
}
var settings_1 = require("./settings");
Object.defineProperty(exports, "config", { enumerable: true, get: function () { return settings_1.settings; } });
function activate() {
    subscriptions.add(atom.commands.add('atom-workspace', 'shell-script-beautifier:format', function () {
        return formatEditorText();
    }), atom.workspace.observeTextEditors(onNewEditor));
}
exports.activate = activate;
function deactivate() {
    subscriptions.dispose();
}
exports.deactivate = deactivate;

},{"./beautifier":"beautifier/index.ts","./settings":"settings.ts"}],"../node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var OVERLAY_ID = '__parcel__error__overlay__';

var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };

  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;

var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = process.env.HMR_HOSTNAME || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + process.env.HMR_PORT + '/');
  ws.onmessage = function(event) {
    checkedAssets = {};
    assetsToAccept = [];

    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function(asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);
          if (didAccept) {
            handled = true;
          }
        }
      });

      // Enable HMR for CSS by default.
      handled = handled || data.assets.every(function(asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();

        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });

        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) { // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      }
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');

      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);

      removeErrorOverlay();

      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;

  overlay.innerHTML = (
    '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' +
      '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' +
      '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' +
      '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' +
      '<pre>' + stackTrace.innerHTML + '</pre>' +
    '</div>'
  );

  return overlay;

}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || (Array.isArray(dep) && dep[dep.length - 1] === id)) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }
  checkedAssets[id] = true;

  var cached = bundle.cache[id];

  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id)
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }
}

},{}]},{},["../node_modules/parcel/src/builtins/hmr-runtime.js","main.ts"], null)
//# sourceMappingURL=/main.js.map
import { FormatInstanceWorker } from './format-instance-worker';

/**
 * ...
 *
 * @param data ...
 * @param path ...
 * @returns ...
 */
export function format(data: string, path = '') {
  return FormatInstanceWorker.apply(data, path);
}

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

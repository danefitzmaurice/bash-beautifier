import { CompositeDisposable, TextEditor } from 'atom';

import { format } from './beautifier';
// import { format } from './beautysh';

const subscriptions = new CompositeDisposable();

/**
 * ...
 *
 * @param editor ...
 */
function formatEditorText(editor?: TextEditor) {
  editor = editor || atom.workspace.getActiveTextEditor();

  if (!editor) return;

  editor.setText(format(editor.getText()));
}

/**
 * ...
 *
 * @param editor ...
 */
function onNewEditor(editor: TextEditor) {
  subscriptions.add(
    editor.getBuffer().onWillSave(() => formatEditorText(editor))
  );
}

export { settings as config } from './settings';

/**
 * ...
 */
export function activate() {
  subscriptions.add(
    atom.commands.add('atom-workspace', 'bash-beautifier:format', () =>
      formatEditorText()
    ),
    atom.workspace.observeTextEditors(onNewEditor)
  );
}

/**
 * ...
 */
export function deactivate() {
  subscriptions.dispose();
}

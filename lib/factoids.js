'use babel';

import { CompositeDisposable } from 'atom';
import XRegExp from 'xregexp';

// Exec XRegExp based on code points, rather than code units
XRegExp.install('astral');

export default {

  subscriptions: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'factoids:decompose': () => this.decompose()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  decompose() {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) return;

    const cursor = editor.getLastCursor();
    const pos = cursor.getBufferPosition();
    if (pos.column === 0) return;

    const stringBeforeCursor = editor.getTextInBufferRange([[pos.row, 0], pos]);
    const char = XRegExp.match(stringBeforeCursor, XRegExp('\\p{Han}$'));
    if (!char) return;

    console.log(char);
  }

};

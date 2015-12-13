'use babel';

import { CompositeDisposable } from 'atom';
import XRegExp from 'xregexp';
import fs from 'fs';
import path from 'path';

// Exec XRegExp based on code points, rather than code units
XRegExp.install('astral');

export default {

  subscriptions: null,
  decomposingDict: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'factoids:decompose': () => this.decompose()
    }));

    this.makeDecomposingDict();
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  makeDecomposingDict() {
    const filePath = path.join(__dirname, 'ids.txt');
    const data = fs.readFileSync(filePath, 'utf8');
      const dict = {}
      data.split('\n').forEach(line => {
        if (line.startsWith('#') || line.startsWith(';')) return;  // Skip comments
      const [_, char, idses] = line.split('\t');
      dict[char] = idses
      });
      this.decomposingDict = dict;
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

    const ids = this.decomposingDict[char];

    const charRange = [[pos.row, pos.column - char.length], pos];
    const selection = editor.addSelectionForBufferRange(charRange);
    selection.insertText(ids, {select: true});
  }

};

'use babel';

import { CompositeDisposable } from 'atom';
import XRegExp from 'xregexp';
import fs from 'fs';
import path from 'path';

// Exec XRegExp based on code points, rather than code units
XRegExp.install('astral');

export default {

  config: {
    sourceLookupOrder: {
      description:
`Some characters have multiple IDS representation (e.g. ⿱咸心[GJK] vs ⿵咸心[TV] for "感").
When decomposing, IDS is chosen according to this order.`.replace('\n', ' '),
      type: 'array',
      default: [...'GTJKV'],
      items: {
        type: 'string',
        enum: [...'GTJKV']
      }
    }
  },

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
      const [_, char, ...idses] = line.split('\t');
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

    const idses = this.decomposingDict[char];
    if (!idses) return;

    let ids;
    if (idses.length === 1) {
      ids = idses[0];
    } else {
      const source2ids = {};
      idses.forEach(s => {
        const m = s.match(/(.+)\[([A-Z]+)\]/);
        [...m[2]].forEach(source => source2ids[source] = m[1]);
      })
      // Get preferable IDS according to `sourceLookupOrder`
      const sourceLookupOrder = atom.config.get('factoids.sourceLookupOrder');
      sourceLookupOrder.push(...'GTJKV');  // append for fallback
      for (const source of sourceLookupOrder) {
        ids = source2ids[source];
        if (ids) break;
      }
    }

    const charRange = [[pos.row, pos.column - char.length], pos];
    const selection = editor.addSelectionForBufferRange(charRange);
    selection.insertText(ids, {select: true});
  }

};

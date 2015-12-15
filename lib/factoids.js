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

  activate() {
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
    const dict = {};
    data.split('\n').forEach(line => {
      if (line.startsWith('#') || line.startsWith(';')) return;  // Skip comments
      const [, char, ...idses] = line.split('\t');
      dict[char] = idses;
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

    const source2ids = {};
    idses.forEach(s => {
      const m = s.match(/(.+)\[([A-Z]+)\]/);
      if (m) {
        [...m[2]].forEach(source => source2ids[source] = m[1]);
      } else {
        // soruce-independent IDS; use the first one
        if (!('-' in source2ids)) source2ids['-'] = s;
      }
    });

    const ids = this.lookupBySource(source2ids);
    const charRange = [[pos.row, pos.column - char.length], pos];
    const selection = editor.addSelectionForBufferRange(charRange);
    selection.insertText(ids, {select: true});
  },

  // Get preferable IDS according to `sourceLookupOrder`
  lookupBySource(source2ids) {
    // if there is a source-independent IDS, use this
    if ('-' in source2ids) return source2ids['-'];

    const order = atom.config.get('factoids.sourceLookupOrder');
    order.push(...'GTJKV');  // append for fallback
    for (const source of order) {
      if (source in source2ids) return source2ids[source];
    }
    return null;
  }

};

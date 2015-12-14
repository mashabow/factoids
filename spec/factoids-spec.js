'use babel';

/* eslint-env jasmine */
/* global waitsForPromise */

describe('Factoids', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('factoids');
    waitsForPromise(() => {
      return atom.workspace.open();
    });
  });

  describe('decompose', () => {

    it('decomposes a character just before the cursor', () => {
      const editor = atom.workspace.getActiveTextEditor();
      editor.insertText('文字');
      editor.setCursorBufferPosition([0, 1]);

      atom.commands.dispatch(workspaceElement, 'factoids:decompose');
      waitsForPromise(() => activationPromise);

      expect(editor.getSelectedText()).toEqual('⿱亠乂');
      expect(editor.getText()).toEqual('⿱亠乂字');
    });

    it('decomposes according to `sourceLookupOrder: JT`', () => {
      const editor = atom.workspace.getActiveTextEditor();
      editor.insertText('共感');
      editor.moveToEndOfLine();

      atom.config.set('factoids.sourceLookupOrder', [...'JT']);
      atom.commands.dispatch(workspaceElement, 'factoids:decompose');
      waitsForPromise(() => activationPromise);

      expect(editor.getSelectedText()).toEqual('⿱咸心');
      expect(editor.getText()).toEqual('共⿱咸心');
    });

    it('decomposes according to `sourceLookupOrder: TJ`', () => {
      const editor = atom.workspace.getActiveTextEditor();
      editor.insertText('共感');
      editor.moveToEndOfLine();

      atom.config.set('factoids.sourceLookupOrder', [...'TJ']);
      atom.commands.dispatch(workspaceElement, 'factoids:decompose');
      waitsForPromise(() => activationPromise);

      expect(editor.getSelectedText()).toEqual('⿵咸心');
      expect(editor.getText()).toEqual('共⿵咸心');
    });

  });
});

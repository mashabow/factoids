'use babel';

import FactoidsView from './factoids-view';
import { CompositeDisposable } from 'atom';

export default {

  factoidsView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.factoidsView = new FactoidsView(state.factoidsViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.factoidsView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'factoids:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.factoidsView.destroy();
  },

  serialize() {
    return {
      factoidsViewState: this.factoidsView.serialize()
    };
  },

  toggle() {
    console.log('Factoids was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};

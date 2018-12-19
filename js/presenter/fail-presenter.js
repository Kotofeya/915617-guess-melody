import Application from '../application';
import FailView from '../views/fail-view';

export default class FailScreen {
  constructor(type) {
    this._view = new FailView(type);
    this._view.bindClickReplay = () => {
      Application.start();
    };
  }

  get element() {
    return this._view.element;
  }
}

import Application from '../application';
import GameView from '../views/game-view';
import TimerView from '../views/timer-view';
import ArtistView from '../views/artist-view';
import GenreView from '../views/genre-view';
import {ONE_SECOND, TIME_IS_EMPTY} from '../data/game-data';
import showScreen from '../utils/show-screen';

export default class GameScreen {
  constructor(model) {
    this.model = model;
    this.setScreenView();
  }

  get element() {
    return this._view.element;
  }

  setScreenView() {
    this.model.changeLevel();
    this.selectScreen();
  }

  selectScreen() {
    this.setScreen();
    this.bindEvents();
  }

  setScreen() {
    const lives = this.model.state.lives;
    const level = this.model.level;
    const questions = this.model.questions;
    const currentQuestion = this.model.question;
    if (!lives) {
      this.model.state.fail = `TRIES`;
      Application.showFail(this.model.state.fail);
      return;
    }
    if (!level) {
      Application.showWelcome();
      return;
    }
    if (level <= questions.length) {
      this.selectQuestionScreen(currentQuestion);
      return;
    }
    Application.showResult(this.model.state);
  }

  selectQuestionScreen(question) {
    switch (question.type) {
      case `artist`:
        this._questionScreen = new ArtistView(this.model, question).template;
        break;
      case `genre`:
        this._questionScreen = new GenreView(this.model, question).template;
        break;
    }
    this.showQuestionScreen(this.model.state, this._questionScreen, question.type);
  }

  showQuestionScreen(state, questionScreen, type) {
    this._view = new GameView(state, questionScreen, type);
    showScreen(this._view.element);
    this.startTimer();
  }

  changeScreen() {
    this.stopTimer();
    this.selectScreen();
  }

  startTimer() {
    this.model._timer = setTimeout(() => {
      this.model.tick();
      const time = this.model.getTime();
      if (time < TIME_IS_EMPTY) {
        this.model.state.fail = `TIME`;
        Application.showFail(this.model.state.fail);
      } else {
        this.startTimer();
        this.updateTimer();
      }
    }, ONE_SECOND);
  }

  stopTimer() {
    clearTimeout(this.model._timer);
  }

  updateTimer() {
    const oldTimer = this._view.element.querySelector(`.j-timer`);
    const header = oldTimer.parentNode;
    const newTimer = new TimerView(this.model._time).element;
    header.replaceChild(newTimer, oldTimer);
  }

  bindEvents() {
    this.bindEventsGenre();
    this.bindEventsArtist();
    this.bindClickReplyLink();
  }

  bindEventsGenre() {
    const genreForm = this.element.querySelector(`.j-genre-form`);
    if (!genreForm) {
      return;
    }

    const buttonAnswer = genreForm.querySelector(`.game__submit`);
    let checkedCheckboxes;

    genreForm.addEventListener(`click`, (event) => {
      if (event.target.name === `answer`) {
        checkedCheckboxes = genreForm.querySelectorAll(`.j-genre-answer:checked`);
        buttonAnswer.disabled = !checkedCheckboxes.length;
      }
    });

    buttonAnswer.addEventListener(`click`, (event) => {
      event.preventDefault();
      const answers = Array.from(checkedCheckboxes);
      this.checkAnswerGenre(answers, this.model._time.time);
    });
  }

  bindEventsArtist() {
    const radioButtons = this.element.querySelectorAll(`.j-artist-answer`);
    if (!radioButtons) {
      return;
    }

    const questions = this.model.questions;
    radioButtons.forEach((radiobutton) => {
      radiobutton.addEventListener(`change`, () => {
        const isRight = questions[this.model.state.level - 1].options[radiobutton.value].answer;
        this.checkAnswerArtist(isRight, this.model._time.time);
      });
    });
  }

  bindClickReplyLink() {
    const linkReply = this.element.querySelector(`.game__back`);
    if (!linkReply) {
      return;
    }

    linkReply.addEventListener(`click`, (event) => {
      event.preventDefault();
      this.stopTimer();
      Application.start();
    });
  }

  checkAnswerGenre(answers, time) {
    let result = true;
    let resultCount = 0;
    let answerCount = 0;
    const questions = this.model.questions;
    const answersAll = questions[this.model.state.level - 1].options;

    for (const answer of answersAll) {
      if (answer.answer) {
        answerCount++;
      }
    }

    answers.forEach((answer) => {
      resultCount += questions[this.model.state.level - 1].options[answer.value].answer;
      result *= questions[this.model.state.level - 1].options[answer.value].answer;
    });

    const success = answerCount === resultCount * result;
    if (!success) {
      this.model.changeLives();
    }

    this.showNextLevel(success, time);
  }

  checkAnswerArtist(success, time) {
    if (!success) {
      this.model.changeLives();
    }
    this.showNextLevel(success, time);
  }

  showNextLevel(success, time) {
    this.model.calcPoints(success, time);
    this.model.changeLevel();
    this.changeScreen();
  }
}
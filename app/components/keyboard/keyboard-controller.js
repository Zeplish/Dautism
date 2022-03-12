import { returnTime, updateCurrentPhraseScroll } from "js/utils";

/**
 * KeyboardController
 * @export
 * @class KeyboardController
 */
export default class KeyboardController {
  /**
   * Creates an instance of KeyboardController.
   *
   * @param {any} $scope
   * @param {any} $global
   * @param {any} $timeout
   * @param {TTSManager} TTSManager
   *
   * @memberOf RecentController
   */
  constructor($scope, $global, $timeout, EventManager, TTSManager) {
    this.$scope = $scope;
    this.$scope.global = $global;
    this.$timeout = $timeout;
    this.tts = TTSManager;
    this.event = EventManager;
    this.fastTypeTimer = null;
    this.suggestions = false;
    // Initilize variables for controller.

    // Call controllerInit
    this.controllerInit();
  }

  /**
   * Create or facilitate new functions for $scope or $global service.
   */
  controllerInit() {
    this.phraseIndex = 0;
    this.suggestionList = [];
  }

  /**
   * Shows the keyboard
   */
  showKeyboard() {
    let typeInput = document.getElementById("typeInput");
    if (typeInput) {
      typeInput.focus();
    }
  }
  /**
   * Removes readonly from typeInput
   * Triggered when type input is
   * Walkaround for ios autocorrect
   */
  showKeyboardFocused(e) {
    let inpCarrier = document.querySelector(".inputCarrier");
    let typeInput = document.getElementById("typeInput");
    if (typeInput) {
      e.preventDefault();
      e.stopPropagation();
      let headerHeight = document.getElementById("header").clientHeight;
      let phHeight = document.querySelector(".phraseHolder").clientHeight;

      document.addEventListener("touchmove", function(ev) {
        ev.preventDefault();
      });

      this.$timeout(() => {
        e.preventDefault();
        e.stopPropagation();
        //   inpCarrier.style.top = parseInt(window.innerHeight - (headerHeight + phHeight + 70)) + 'px';
        window.scrollTo(0, 0);
        console.log("virtual keyboard opened!");
        this.showHideSuggestions(true);
      }, 500);
    }
  }

  /**
   * Hides the keyboard
   */
  hideKeyboard() {
    let inpCarrier = document.querySelector(".inputCarrier");
    let typeInput = document.getElementById("typeInput");
    if (typeInput) {
      document.getElementById("generalCarrier").style.height = "100%";
      inpCarrier.style.top = "0px";
      this.showHideSuggestions(false);
    }
  }

  /**
   * Shows/Hides the suggestionList
   */
  showHideSuggestions(status) {
    let suggestionList = document.getElementById("suggestionList");
    if (suggestionList) {
      suggestionList.style.opacity = status ? "1" : "0";
    }
  }

  /**
   * Submits (handles) the current typeInput string content.
   */
  submitCurrentInput() {
    let typeInput = document.getElementById("typeInput");
    if (typeInput.value) {
      let inputWord = {};
      inputWord.title = typeInput.value.toLocaleLowerCase();
      let getFromMap = this.$scope.global.extendedSlugMap[inputWord.title];
      if (getFromMap) {
        inputWord.slug = getFromMap;
      } else {
        inputWord.slug = inputWord.title;
      }
      let checkExist = this.checkWordInDB(inputWord.slug);
      inputWord.slugExist = !checkExist;

      if (inputWord.title.contains(" ") && !checkExist) {
        this.recognizeWord(inputWord.title);
      } else {
        inputWord.phraseIndex = this.phraseIndex++;
        this.$scope.global.pushToCurrentPhrase(inputWord);
      }
      updateCurrentPhraseScroll();
      this.tts.speak(inputWord.title);
      let gs = this.$scope.global.gridSize;
      this.event.appWord(inputWord.title, gs[0], gs[1], true);
      typeInput.value = "";
    }
  }

  /**
   * Handles the submission of the input via "enter" from the device
   */
  enterSubmit($event) {
    if ($event.keyCode === 13) {
      this.submitCurrentInput();
      this.suggestionList = [];
    } else {
      let typeInput = document.getElementById("typeInput");
      if (typeInput) {
        // If there is a timeout, clear it.
        if (this.fastTypeTimer) {
          this.$timeout.cancel(this.fastTypeTimer);
        }
        this.fastTypeTimer = this.$timeout(() => {
          if (typeInput.value.length > 1) {
            this.suggestWordsByInput(typeInput.value);
          } else {
            this.suggestionList = [];
            this.suggestions = false;
          }
        }, 300);
      }
    }
  }

  /**
   * Handles, creates the data to set suggestions by,
   * current keyboard input.
   */
  suggestWordsByInput(searchLetter) {
    this.suggestions = true;
    searchLetter = searchLetter.toLocaleLowerCase();
    //searchLetter = searchLetter.replace(" ", "-");
    // Might need replace all?
    this.suggestionList = this.$scope.global.extendedTitleArray.filter(word => {
      if (word) {
        return word.substring(0, searchLetter.length) == searchLetter;
      }
    });
    if (this.suggestionList.length > 0) {
      this.suggestionList = this.suggestionList.filter(
        (it, i, ar) => ar.indexOf(it) === i,
      );
      this.suggestionList.sort(this.sortByLength);
    }
  }

  /**
   * Handles actions when a suggestion symbol is clicked
   */
  clickSuggestion(wordSlug) {
    let wordObj2Push = {};
    wordObj2Push.title = wordSlug.replace("-", " ");
    wordObj2Push.slug = this.$scope.global.extendedSlugMap[wordSlug];
    if (this.isVerb(wordSlug)) {
      wordObj2Push.type = "verb";
    }
    wordObj2Push.phraseIndex = this.phraseIndex++;
    this.$scope.global.pushToCurrentPhrase(wordObj2Push);
    this.tts.speak(wordObj2Push.title);
    let typeInput = document.getElementById("typeInput");
    if (typeInput) {
      document.getElementById("typeInput").value = "";
    }
    this.suggestionList = [];
    this.suggestions = false;
  }

  /**
   * Recognizes the string given by the current word package before pushing.
   * Then pushes the pieces indivicually.
   */
  recognizeWord(word) {
    // this function can be better algorithmicly!
    let splittedUnrecognizedWord = word.split(" ");
    splittedUnrecognizedWord.forEach(wordPiece => {
      if (wordPiece) {
        let wordObj2Push = {};
        wordObj2Push.title = wordPiece;
        let getFromMap = this.$scope.global.extendedSlugMap[wordPiece];
        if (getFromMap) {
          wordObj2Push.slug = getFromMap;
        } else {
          wordObj2Push.slug = wordPiece;
        }
        wordObj2Push.slugExist = !this.checkWordInDB(wordObj2Push.slug);
        wordObj2Push.phraseIndex = this.phraseIndex++;
        this.$scope.global.pushToCurrentPhrase(wordObj2Push);
      }
    });
  }

  /**
   * Checks if the given word in the mainSlugArray
   */
  checkWordInDB(word) {
    return this.$scope.global.extendedSlugArray.contains(word);
  }

  /**
   * Checks if the given word is a verb.
   */
  isVerb(word) {
    let words = this.$scope.global.mainArray.filter(w => {
      return w.slug == word;
    });
    if (words.length > 0) {
      if (words[0].type == "verb") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Turn suggested word into its slug
   */
  slugSuggest(suggestWord) {
    return this.$scope.global.extendedSlugMap[suggestWord];
  }

  /**
   * Comparission function for .sort() prototype.
   */
  sortByLength(a, b) {
    if (a.length > b.length) {
      return 1;
    }
    if (a.length < b.length) {
      return -1;
    }
    return 0;
  }
}

// Service Dependency Injection
KeyboardController.$inject = [
  "$scope",
  "$global",
  "$timeout",
  "EventManager",
  "TTSManager",
];

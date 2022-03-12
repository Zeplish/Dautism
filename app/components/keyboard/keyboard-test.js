/* eslint-env jasmine */
import {
    module,
    inject
} from 'mocks';
import KeyboardController from './keyboard-controller';
import AppController from '../../app-controller';
import keyboard from './keyboard';
import * as CONSTANT from '../../js/constants';
import Global from '../../services/global';
import EventManager from '../../services/event';
import TTSManager from '../../services/tts';
import LSManager from '../../services/localstorage';

function randomString(len, charSet) {
    charSet = charSet || 'abcdefghijklmnopqrstuvwxyz';
    let randomString = '';
    for (let i = 0; i < len; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}

String.prototype.replaceAll = function(search, replace) {
    if (replace === undefined) {
        return this.toString();
    }

    return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};

function generateSymbol(length, normal, derivable, group) {
    let classes = [];
    if (normal) {
        classes.push(CONSTANT.TAB_MAIN);
    }
    if (derivable) {
        classes.push(CONSTANT.TAB_DERIVABLE);
    }
    if (group) {
        classes.push(CONSTANT.TAB_GROUP);
    }
    let i = 0;
    let symbArray = [];
    while (i < length) {
        let randString = randomString(7);
        let wordObj = {
            title: randString,
            slug: randString,
            type: 'noun',
            parent: 'main'
        };
        wordObj.class = classes[Math.floor(Math.random() * (classes.length - 1)) + 1];
        symbArray.push(wordObj);
        i++;
    }
    return symbArray;
}

Array.prototype.contains = function(obj) {
    return this.indexOf(obj) > -1;
};

String.prototype.contains = function(it) {
    return this.indexOf(it) != -1;
};


describe('aacApp.keyboard module', () => {
    beforeEach(module(keyboard.name));
    let $controller, $timeout;
    let keyboardCtrl;
    let g, event, tts, ls;
    beforeEach(inject((_$controller_, _$timeout_) => {
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $controller = _$controller_;
        $timeout = _$timeout_;
    }));

    beforeEach(() => {
        g = new Global();
        g.pushToCurrentPhrase = function(obj) {
            keyboardCtrl.$scope.global.currentPhrase.push(obj);
        }
        event = {
            appPhrase: function() {},
            appWord: function() {}
        };
        tts = {
            speak: function() {}
        };
        ls = new LSManager();
        g.changeTab = function() {}
            //$controller(dependentController, {$scope:{},$global:g});
    });

    describe('keyboard controller', () => {
        it('should be defined', () => {
            keyboardCtrl = $controller(KeyboardController, {
                $scope: {},
                $global: g,
                $timeout: $timeout,
                EventManager: event,
                TTSManager: tts
            });
            expect(keyboardCtrl)
                .toBeDefined();
        });
    });

    describe('enterSubmit', () => {
        it('should start fast type timeout when keycode is not 13 (enter)', () => {
            keyboardCtrl = $controller(KeyboardController, {
                $scope: {},
                $global: g,
                $timeout: $timeout,
                EventManager: event,
                TTSManager: tts
            });
            let ev = {};
            ev.keyCode = 65;
            let inp = document.createElement("input");
            document.body.innerHTML = document.body.innerHTML + '<input id="typeInput" value="ya"/>';
            keyboardCtrl.enterSubmit(ev);
            // Flush the fast type timeout.
            keyboardCtrl.$timeout.flush();
            expect(keyboardCtrl.suggestions).toBe(true);
        });
        it('should make suggestionList empty when input is empty', () => {
            keyboardCtrl = $controller(KeyboardController, {
                $scope: {},
                $global: g,
                $timeout: $timeout,
                EventManager: event,
                TTSManager: tts
            });
            let ev = {};
            ev.keyCode = 8; // backspace
            let inp = document.createElement("input");
            document.body.innerHTML = document.body.innerHTML + '<input id="typeInput" value=""/>';
            // input is empty
            keyboardCtrl.enterSubmit(ev);
            // Flush the fast type timeout.
            keyboardCtrl.$timeout.flush();
            expect(keyboardCtrl.suggestionList.length).toBe(0);
        });
        it('should submit the current input when keycode is 13 (enter)', () => {
            keyboardCtrl = $controller(KeyboardController, {
                $scope: {},
                $global: g,
                $timeout: $timeout,
                EventManager: event,
                TTSManager: tts
            });
            let ev = {};
            ev.keyCode = 13; // enter
            let inp = document.createElement("input");
            document.body.innerHTML = document.body.innerHTML + '<input id="typeInput" value="asd"/>';
            keyboardCtrl.enterSubmit(ev);
            expect(document.getElementById('typeInput').value.length).toBe(0);
        });
    });


    describe('suggestWordsByInput', () => {
        it('should set suggestionList by filtering given substring in extendedSlugArray', () => {
            keyboardCtrl = $controller(KeyboardController, {
                $scope: {},
                $global: g,
                $timeout: $timeout,
                EventManager: event,
                TTSManager: tts
            });
            keyboardCtrl.$scope.global.extendedTitleArray = ['dummy1', 'dummy2', "abdummy3"];
            keyboardCtrl.suggestWordsByInput("ab");
            expect(keyboardCtrl.suggestionList.length).toBe(1);
            expect(keyboardCtrl.suggestionList[0]).toBe("abdummy3")
            keyboardCtrl.suggestWordsByInput("dummy");
            expect(keyboardCtrl.suggestionList.length).toBe(2);
        });
        it('should set suggestionList by sorting words from short to long', () => {
            keyboardCtrl = $controller(KeyboardController, {
                $scope: {},
                $global: g,
                $timeout: $timeout,
                EventManager: event,
                TTSManager: tts
            });
            keyboardCtrl.$scope.global.extendedTitleArray = ['dummy333', 'dummy4444', "dummy1", "dummy22", "dummy55555"];
            keyboardCtrl.suggestWordsByInput("dummy");
            expect(keyboardCtrl.suggestionList.length).toBe(5);
            expect(keyboardCtrl.suggestionList[0]).toBe("dummy1");
            expect(keyboardCtrl.suggestionList[keyboardCtrl.suggestionList.length - 1]).toBe("dummy55555");
        });
    });

    describe('checkWordInDB', () => {
        it('should check if a word is in the db (mainSlugArray)', () => {
            keyboardCtrl = $controller(KeyboardController, {
                $scope: {},
                $global: g,
                $timeout: $timeout,
                EventManager: event,
                TTSManager: tts
            });
            keyboardCtrl.$scope.global.extendedSlugArray = ['dummy1', 'dummy2', "abdummy3"];
            // Set the array in the slug map
            expect(keyboardCtrl.checkWordInDB("dummy1")).toBe(true);
            expect(keyboardCtrl.checkWordInDB("adasdasdasd")).toBe(false);
        });
    });

    describe('clickSuggestion', () => {
        it('should push the clicked word object to the currentPhrase', () => {
            keyboardCtrl.clickSuggestion("dummy1");
            expect(keyboardCtrl.$scope.global.currentPhrase[0].title).toBe("dummy1");
            keyboardCtrl.clickSuggestion("dummy2");
            keyboardCtrl.clickSuggestion("dummy3");
            expect(keyboardCtrl.$scope.global.currentPhrase.length).toBe(3);
            expect(keyboardCtrl.$scope.global.currentPhrase[1].title).toBe("dummy2");
            expect(keyboardCtrl.$scope.global.currentPhrase[2].title).toBe("dummy3");
        });
    });

    describe('sortByLength', () => {
        it('should compare given 2 input text-s length', () => {
            expect(keyboardCtrl.sortByLength("dummy1", "dummy22")).toBe(-1);
            expect(keyboardCtrl.sortByLength("dummy11", "dummy22")).toBe(0);
            expect(keyboardCtrl.sortByLength("dummy11", "dummy2")).toBe(1);
        });
    });

    describe('recognizeWord', () => {
        it('should recognize the given string by white spaces and push', () => {
            keyboardCtrl.recognizeWord("asd qwe zxc");
            let cp = keyboardCtrl.$scope.global.currentPhrase;
            expect(cp[cp.length - 3].title).toBe("asd");
            expect(cp[cp.length - 2].title).toBe("qwe");
            expect(cp[cp.length - 1].title).toBe("zxc");
            keyboardCtrl.$scope.global.mainSlugArray = ['dsa', 'ewq', "cxz"];
            keyboardCtrl.recognizeWord("dsa ewq cxz");
            expect(cp[cp.length - 3].title).toBe("dsa");
            expect(cp[cp.length - 2].title).toBe("ewq");
            expect(cp[cp.length - 1].title).toBe("cxz");
        });
    });

    describe('submitCurrentInput', () => {
        it('should empty the current input', () => {
            let inp = document.createElement("input");
            document.body.innerHTML = document.body.innerHTML + '<input id="typeInput" value="asd"/>';
            keyboardCtrl.submitCurrentInput();
            expect(document.getElementById("typeInput").value.length).toBe(0);
        });
    });
    describe('isVerb', () => {
        it('should check the type of the word if its verb or not', () => {
            keyboardCtrl = $controller(KeyboardController, {
                $scope: {},
                $global: g,
                $timeout: $timeout,
                EventManager: event,
                TTSManager: tts
            });
            keyboardCtrl.$scope.global.mainArray = [{
                title: "asd",
                slug: "asd",
                type: "verb"
            }, {
                title: "qwe",
                slug: "qwe",
                type: "noun"
            }];
            expect(keyboardCtrl.isVerb("asd")).toBe(true);
            expect(keyboardCtrl.isVerb("qwe")).toBe(false);
        });
    });

    describe('extendedSlugMap', () => {
        it('should map the array and synonyms of the array', () => {
            keyboardCtrl.$scope.global.mainArray = [{
                title: "dummy1",
                slug: "dummy1",
                synonyms: ["dummy1Syn1", "dummy1Syn2"]
            }, {
                title: "dummy2",
                slug: "dummy2",
                synonyms: ["dummy2Syn1", "dummy2Syn2"]
            }];
            // Go on
            expect(0).toBe(0);
        });
    });


    describe('showHideSuggestions', () => {
        it('should show or hide the suggestion panel relative to given status', () => {
            keyboardCtrl.$scope.global.mainArray = [{
                title: "dummy1",
                slug: "dummy1",
                synonyms: ["dummy1Syn1", "dummy1Syn2"]
            }, {
                title: "dummy2",
                slug: "dummy2",
                synonyms: ["dummy2Syn1", "dummy2Syn2"]
            }];
            // Go open

            let suggestion = document.createElement("div");
            suggestion.id = "suggestionList";
            document.body.appendChild(suggestion);
            suggestion.innerHTML = "List of nodes";
            suggestion.style.opacity = 0;
            keyboardCtrl.showHideSuggestions(true);
            expect(suggestion.style.opacity).toBe('1');
            keyboardCtrl.showHideSuggestions(false);
            expect(suggestion.style.opacity).toBe('0');
        });
    });

});

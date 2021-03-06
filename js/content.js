// Avac parameters
let level;
let langFrom;
let langTo;
let rainbow;
// Process variables
let isNewLang = false;
let regExp;
let dicFrom;
let dicTo;
let fromSpeak;
let toSpeak;

/* Listen popup.js */
window.onload = function () {
    storage.get('power', obj => {
        if (obj.power) {
            storage.get('level', obj => {
                obj.level ? level = obj.level : level = 0;
                storage.get('langFrom', obj => {
                    obj.langFrom ? langFrom = obj.langFrom : 'eng';
                    storage.get('langTo', obj => {
                        obj.langTo ? langTo = obj.langTo : 'eng';
                        storage.get('color', obj => {
                            obj.color ? rainbow = obj.color : 'green';
                            invoke();
                        });
                    });
                });
            });
        }
    });

    chrome.runtime.onMessage.addListener(
        msgObj => {
            let params = JSON.parse(msgObj);
            if (params.power) {
                isNewLang = (langFrom !== params.langFrom || langTo !== params.langTo);
                level = params.level;
                langTo = params.langTo;
                langFrom = params.langFrom;
                rainbow = params.color;
                invoke();
            } else {
                document.location.reload(true);
            }
        });
};


function invoke() {
    setDictionary();
    setWordStyle();
    setRegExp();
    if (isNewLang) {
        if (0 !== document.getElementsByClassName("wordAvac").length) {
            removeElementsByClass('wordAvac');
        }
        translateText();
    } else if (0 !== document.getElementsByClassName("wordAvac").length) {
        applyLevel(level);
    } else {
        translateText();
    }
}

function translateText() {
    let tags = [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'i', 'em', 'b', 'strong',
        'li', 'font', 'td', 'dd',
        'textarea', 'article'
    ];

    tags.forEach(arg => wrapElementWordsIntoSpan(arg));

    let word;
    let rank;
    for (let w of document.getElementsByClassName('AVAC')) {
        word = w.innerText.trim().toLocaleLowerCase();
        rank = dicFrom.indexOf(word);
        if (-1 !== rank) {
            addSpeakerOnClick(w);
            w.innerHTML += `<span hidden class="wordAvac ___${rank}"> [${dicTo[rank]}]</span>`;
        }
    }
    applyLevel(level);
}

function wrapElementWordsIntoSpan(tag) {
    for (let el of document.getElementsByTagName(tag)) {
        let ap = '';
        for (let ch = el.firstChild; ch !== null; ch = ch.nextSibling) {
            if (ch.nodeType === Node.TEXT_NODE) {
                ap += ch.textContent.replace(regExp, `<span class="AVAC">$1</span>`);
            } else if (ch.outerHTML !== undefined) {
                ap += ch.outerHTML;
            }
        }
        el.innerHTML = ap;
    }
}

function applyLevel(level) {
    for (let w of document.getElementsByClassName('wordAvac')) {
        w.style.display = 'inline';
    }
    let maxRank = level ** Math.exp(1); // max = 64^exp = 81228
    for (let w of document.getElementsByClassName('wordAvac')) {
        if (Number(w.classList[1].substring(3, 8)) < maxRank) {
            w.style.display = 'none';
        }
    }
}

function setWordStyle() {
    let style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `.wordAvac { color: ${rainbow} }`;
    document.getElementsByTagName('head')[0].appendChild(style);
}

function setRegExp() {
    switch (langFrom) {
        case ENGLISH:
            regExp = new RegExp(/([a-zA-Z'-]+)/gi);
            break;
        case DEUTSCH:
            regExp = new RegExp(/([a-zA-ZäöüÄÖÜß']+)/gi);
            break;
        case RUSSIAN:
            regExp = new RegExp(/([а-яА-ЯЁё-]+)/gi);
            break;
        case SPANISH:
            regExp = new RegExp(/([a-zA-ZáéíñóúüÁÉÍÑÓÚÜ¿]+)/gi);
            break;
    }
}

function setDictionary() {
    switch (langFrom) {
        case ENGLISH: {
            dicFrom = eng;
            if (langTo === RUSSIAN) dicTo = eng_rus;
            else if (langTo === DEUTSCH) dicTo = eng_deu;
            else if (langTo === SPANISH) dicTo = eng_spa;
        }
            break;
        case RUSSIAN: {
            dicFrom = rus;
            if (langTo === ENGLISH) dicTo = rus_eng;
            else if (langTo === DEUTSCH) dicTo = rus_deu;
            else if (langTo === SPANISH) dicTo = rus_spa;
        }
            break;
        case DEUTSCH: {
            dicFrom = deu;
            if (langTo === ENGLISH) dicTo = deu_eng;
            else if (langTo === RUSSIAN) dicTo = deu_rus;
            else if (langTo === SPANISH) dicTo = deu_spa;
        }
            break;
        case SPANISH: {
            dicFrom = spa;
            if (langTo === ENGLISH) dicTo = spa_eng;
            else if (langTo === RUSSIAN) dicTo = spa_rus;
            else if (langTo === DEUTSCH) dicTo = spa_deu;
        }
            break;
    }
}

function addSpeakerOnClick(elem) {
    if (langFrom === ENGLISH) fromSpeak = 'en-GB';
    else if (langFrom === RUSSIAN) fromSpeak = 'ru-RU';
    else if (langFrom === DEUTSCH) fromSpeak = 'de-DE';
    else if (langFrom === SPANISH) fromSpeak = 'es-ES';

    if (langTo === ENGLISH) toSpeak = 'en-GB';
    else if (langTo === RUSSIAN) toSpeak = 'ru-RU';
    else if (langTo === DEUTSCH) toSpeak = 'de-DE';
    else if (langTo === SPANISH) toSpeak = 'es-ES';

    elem.onclick = function () {
        let str = elem.innerText.split('[');
        speakWord(str[0], fromSpeak, 1, 1, 1, 'native');
        if (str[1] !== undefined) {
            speakWord(str[1], toSpeak, 1, 1, 1, 'native');
        }
    };
}

/* Speak word use SpeechSynthesisUtterance */
function speakWord(word, lang, volume, rate, pitch, voiceURI) {
    let msg = new SpeechSynthesisUtterance();
    msg.voiceURI = voiceURI;
    msg.pitch = pitch;      // 0 to 2
    msg.volume = volume;    // volume, from 0 to 1, default is 1
    msg.rate = rate;        // speaking rate, default is 1 (0.1 to 10)
    msg.lang = lang;        // language, default is 'en-US'
    msg.text = word;
    window.speechSynthesis.speak(msg);
}

function removeElementsByClass(className) {
    let el = document.getElementsByClassName(className);
    while (el.length > 0) {
        el[0].parentNode.removeChild(el[0]);
    }
}

Array.prototype.remove = function (value) {
    let idx = this.indexOf(value);
    if (idx !== -1) {
        return this.splice(idx, 1);
    }
    return false;
};
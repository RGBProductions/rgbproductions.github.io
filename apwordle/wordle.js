let currentWord = "";

let words = [];
let guess = [];

fetch("words.json").then(res => res.json().then(data => {
    words = data;
    guess = [...new Set([...guess, ...data])];
}))
fetch("guess.json").then(res => res.json().then(data => {
    guess = [...new Set([...guess, ...data])];
}))

let previousWords = [];
function getWord() {
    let word;
    while (!word || previousWords.includes(word)) {
        word = words[Math.floor(Math.random()*words.length)];
    }
    previousWords.push(word);
    if (previousWords.length > 5) previousWords.shift();
    return word;
}

class WordleResult {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }

    static invalid() {
        return new WordleResult(0);
    }

    static matched(input) {
        let slots = [0,0,0,0,0];
        let available = currentWord.split("");
        // Greens pass
        for (let i = 0; i < input.length; i++) {
            let chr = input.charAt(i);
            let real = currentWord.charAt(i);
            let ind = available.indexOf(chr);
            if (real == chr) {
                slots[i] = 2;
                if (ind != -1) available.splice(ind, 1);
            }
        }
        // Yellows pass
        for (let i = 0; i < input.length; i++) {
            let chr = input.charAt(i);
            let ind = available.indexOf(chr);
            if (ind != -1 && slots[i] != 2) {
                slots[i] = 1;
                available.splice(ind, 1);
            }
        }
        return new WordleResult((slots.includes(1) || slots.includes(0)) ? 1 : 2, slots);
    }
}

export class Wordle {
    static async start() {
        // currentWord = force ?? (await electron.getWord());
        currentWord = getWord();
    }

    static async guess(word) {
        // if (!(await electron.isWordValid(word))) return WordleResult.invalid();
        if (!guess.includes(word)) return WordleResult.invalid();
        return WordleResult.matched(word);
    }

    static get word() {
        return currentWord;
    }
}
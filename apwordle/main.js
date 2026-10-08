import { Archipelago } from "./archipelago.js";
import { allCells, board, boardElem, connectButton, darkButton, deathlinkWarning, endButtons, forfeitContainer, forfeitPanel, gameButtons, hint, keyboard, letterButtons, setupContainer, setupPanel, wordReveal, wordRevealWord } from "./ui.js";
import { Wordle } from "./wordle.js";

let row = 0;
let char = 0;
let playing = false;

let valid = "abcdefghijklmnopqrstuvwxyz";

let dark = localStorage.getItem("darktheme") == "true";

function setDark(v) {
    dark = v;
    if (dark) {
        document.body.classList.add("dark");
        darkButton.innerText = "Light";
    } else {
        document.body.classList.remove("dark");
        darkButton.innerText = "Dark";
    }
    localStorage.setItem("darktheme", `${dark}`);
}

darkButton.addEventListener("click", () => {
    setDark(!dark);
})

setDark(dark);

function endGame(success) {
    gameButtons.classList.remove("visible");
    gameButtons.classList.add("hidden");
    keyboard.classList.remove("visible");
    keyboard.classList.add("hidden");
    playing = false;
    setTimeout(async () => {
        wordRevealWord.innerText = Wordle.word.toUpperCase();
        if (success) {
            wordRevealWord.classList.remove("failure");
            wordRevealWord.classList.add("success");
        } else {
            wordRevealWord.classList.remove("success");
            wordRevealWord.classList.add("failure");
        }
        wordReveal.classList.remove("hidden");
        wordReveal.classList.add("visible");
        if (success) {
            hint.innerText = "Congratulations!";
            if (Archipelago.connected) {
                let location = Archipelago.missingLocation;
                if (!location) {
                    setTimeout(() => {
                        hint.classList.remove("hidden");
                        hint.classList.add("visible");
                        setTimeout(() => {
                            endButtons.classList.add("visible");
                            endButtons.classList.remove("hidden");
                        }, 500);
                    }, 500);
                } else {
                    let items = await Archipelago.scoutHint(location);
                    let item = items[0];
                    let game = Archipelago.getPlayerGame(item.player);
                    hint.innerHTML = "";
                    let span1 = document.createElement("span");
                    span1.innerText = "You will find ";
                    let span2 = document.createElement("span");
                    let span3 = document.createElement("span");
                    if (item.player == Archipelago.slot) {
                        span2.innerText = "you";
                        span3.innerText = "r ";
                    } else {
                        span2.innerText = Archipelago.getPlayerName(item.player);
                        span2.className = "ap-player";
                        span3.innerText = "'s ";
                    }
                    let span4 = document.createElement("span");
                    span4.innerText = Archipelago.getItemName(game, item.item);
                    if (item.flags & 0b001) span4.classList.add("ap-item-progression");
                    if (item.flags & 0b010) span4.classList.add("ap-item-useful");
                    if (item.flags & 0b100) span4.classList.add("ap-item-trap");
                    if (item.flags == 0) span4.classList.add("ap-item-filler");
                    let span5 = document.createElement("span");
                    span5.innerText = " at ";
                    let span6 = document.createElement("span");
                    span6.innerText = Archipelago.getLocationName(Archipelago.getPlayerGame(Archipelago.slot), item.location);
                    span6.className = "ap-location";
                    let span7 = document.createElement("span");
                    span7.innerText = ".";

                    hint.appendChild(span1);
                    hint.appendChild(span2);
                    hint.appendChild(span3);
                    hint.appendChild(span4);
                    hint.appendChild(span5);
                    hint.appendChild(span6);
                    hint.appendChild(span7);

                    setTimeout(() => {
                        hint.classList.remove("hidden");
                        hint.classList.add("visible");
                        setTimeout(() => {
                            endButtons.classList.add("visible");
                            endButtons.classList.remove("hidden");
                        }, 500);
                    }, 500);
                }
            } else {
                setTimeout(() => {
                    hint.classList.remove("hidden");
                    hint.classList.add("visible");
                    setTimeout(() => {
                        endButtons.classList.add("visible");
                        endButtons.classList.remove("hidden");
                    }, 500);
                }, 500);
            }
        } else {
            setTimeout(() => {
                endButtons.classList.add("visible");
                endButtons.classList.remove("hidden");
            }, 500);
        }
    }, 500);

    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
            let cell = board[r][c];
            cell.classList.remove("selected");
            setTimeout(() => {
                cell.classList.add("fill");
            }, 50*r);
        }
    }
}

window.pressKey = async (k) => {
    let prev = board[row][Math.max(0, Math.min(4, char-1))];
    let cur = board[row][Math.max(0, Math.min(4, char))];
    if (k == "backspace" || k == "delete") {
        char = Math.max(0, char-1);
        prev.innerText = "";
    } else if (k == "enter") {
        let word = "";
        for (let cell of board[row]) {
            word += cell.innerText;
        }
        let result = await Wordle.guess(word.toLowerCase());
        if (result.type != 0) {
            if (result.type == 2) {
                playing = false;
                setTimeout(() => endGame(true), 750);
            }
            for (let i = 0; i < result.data.length; i++) {
                let cell = board[row][i];
                setTimeout(() => {
                    cell.classList.remove("s0");
                    cell.classList.remove("s1");
                    cell.classList.remove("s2");
                    cell.classList.add(`s${result.data[i]}`);
                    cell.classList.add("fill");
                }, i*100);
                setTimeout(() => {
                    let lb = letterButtons[cell.innerText.toLowerCase()];
                    if (!lb.classList.contains(`s${result.data[i]+1}`) && !lb.classList.contains(`s${result.data[i]+2}`)) {
                        lb.classList.remove("s0");
                        lb.classList.remove("s1");
                        lb.classList.remove("s2");
                        lb.classList.add(`s${result.data[i]}`);
                    }
                }, 600);
            }
            row++;
            if (row == 6 && result.type != 2) {
                playing = false;
                setTimeout(() => endGame(false), 750);
            }
            char = 0;
        }
    } else if (valid.includes(k)) {
        cur.innerText = k.toUpperCase();
        char = Math.min(5, char+1);
    }
    for (let cell of allCells) {
        cell.classList.remove("selected");
    }
    if (playing) board[row][Math.max(0, Math.min(4, char))].classList.add("selected");
}

document.addEventListener("keydown", async (e) => {
    if (!playing) return;

    if (e.key == "Enter") e.preventDefault();
    window.pressKey(e.key.toLowerCase());
})

window.startGame = () => {
    if (playing) return;
    row = 0;
    char = 0;
    gameButtons.classList.remove("hidden");
    gameButtons.classList.add("visible");
    endButtons.classList.remove("visible");
    endButtons.classList.add("hidden");
    wordReveal.classList.remove("visible");
    wordReveal.classList.add("hidden");
    keyboard.classList.remove("hidden");
    keyboard.classList.add("visible");
    hint.classList.remove("visible");
    hint.classList.add("hidden");
    Wordle.start();
    playing = true;
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
            let cell = board[r][c];
            cell.classList.remove("selected");
            setTimeout(() => {
                cell.classList.remove("s0");
                cell.classList.remove("s1");
                cell.classList.remove("s2");
                cell.classList.add("fill");
                cell.innerText = "";
            }, 50*(r+c));
        }
    }
    for (let [letter,button] of Object.entries(letterButtons)) {
        button.classList.remove("s0");
        button.classList.remove("s1");
        button.classList.remove("s2");
    }
    board[0][0].classList.add("selected");
    setupContainer.classList.remove("visible");
    setupContainer.classList.add("hidden");
    setupPanel.classList.remove("visible");
    setupPanel.classList.add("hidden");
}

window.tryForfeit = () => {
    deathlinkWarning.style.visibility = (row == 0 || !Archipelago.connected) ? "hidden" : "visible";
    forfeitContainer.classList.remove("hidden");
    forfeitContainer.classList.add("visible");
    forfeitPanel.classList.remove("hidden");
    forfeitPanel.classList.add("visible");
}

window.forfeit = () => {
    endGame(false);
    forfeitContainer.classList.add("hidden");
    forfeitContainer.classList.remove("visible");
    forfeitPanel.classList.add("hidden");
    forfeitPanel.classList.remove("visible");
}

window.dontForfeit = () => {
    forfeitContainer.classList.add("hidden");
    forfeitContainer.classList.remove("visible");
    forfeitPanel.classList.add("hidden");
    forfeitPanel.classList.remove("visible");
}

window.exitToMenu = () => {
    wordReveal.classList.remove("visible");
    wordReveal.classList.add("hidden");
    hint.classList.remove("visible");
    hint.classList.add("hidden");
    gameButtons.classList.remove("visible");
    gameButtons.classList.add("hidden");
    endButtons.classList.remove("visible");
    endButtons.classList.add("hidden");
    setupContainer.classList.add("visible");
    setupContainer.classList.remove("hidden");
    setupPanel.classList.add("visible");
    setupPanel.classList.remove("hidden");
}

window.tryConnectAp = () => {
    if (Archipelago.socket && Archipelago.socket.readyState == WebSocket.OPEN) {
        Archipelago.disconnect();
        connectButton.innerText = "Connect";
        return;
    }
    connectButton.innerText = "Working";
    connectButton.disabled = true;
    let host = document.getElementById("ap-hostname").value;
    let port = parseInt(document.getElementById("ap-port").value);
    let slot = document.getElementById("ap-slot").value;
    let pass = parseInt(document.getElementById("ap-password").value);
    localStorage.setItem("ap-hostname", host);
    localStorage.setItem("ap-port", port);
    localStorage.setItem("ap-slot", slot);
    Archipelago.connect(host, port);
    Archipelago.connectSlot(slot, pass);
    Archipelago.socket.addEventListener("open", () => {
        connectButton.disabled = false;
        connectButton.innerText = "Disconnect";
    })
}

document.addEventListener("DOMContentLoaded", () => {
    setupContainer.classList.remove("hidden");
    setupContainer.classList.add("visible");
    setupPanel.classList.remove("hidden");
    setupPanel.classList.add("visible");

    document.getElementById("ap-hostname").value = localStorage.getItem("ap-hostname") ?? document.getElementById("ap-hostname").value;
    document.getElementById("ap-port").value = localStorage.getItem("ap-port") ?? document.getElementById("ap-port").value;
    document.getElementById("ap-slot").value = localStorage.getItem("ap-slot") ?? document.getElementById("ap-slot").value;
});
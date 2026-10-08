export const boardElem = document.getElementById("board");
export const board = [];
export const allCells = [];
export const wordReveal = document.getElementById("word-reveal");
export const wordRevealWord = document.getElementById("word");
export const hint = document.getElementById("hint");
export const setupContainer = document.getElementById("setup");
export const setupPanel = document.getElementById("setup-panel");
export const forfeitContainer = document.getElementById("forfeit");
export const forfeitPanel = document.getElementById("forfeit-panel");
export const gameButtons = document.getElementById("options-game");
export const endButtons = document.getElementById("options-end");
export const deathlinkWarning = document.getElementById("deathlink-warning");
export const connectButton = document.getElementById("ap-connect");
export const darkButton = document.getElementById("todark");
export const letterButtons = {};
export const keyboard = document.getElementById("letters");

for (let row of document.getElementById("letters").children) {
    for (let button of row.children) {
        button.addEventListener("click", () => {
            window.pressKey(button.innerText.toLowerCase());
        })

        letterButtons[button.innerText.toLowerCase()] = button;
    }
}

for (let r = 0; r < 6; r++) {
    let row = document.createElement("div");
    row.classList.add("row");
    board.push([]);
    for (let c = 0; c < 5; c++) {
        let cell = document.createElement("div");
        cell.classList.add("cell");
        cell.addEventListener("animationend", () => {
            cell.classList.remove("fill");
        })
        row.appendChild(cell);
        board[r].push(cell);
        allCells.push(cell);
    }
    boardElem.appendChild(row);
}
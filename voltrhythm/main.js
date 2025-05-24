let boxes = [];

const NUM_BOXES = 64;
const COLORS = [
    "BOX-BLUE", "BOX-GREEN", "BOX-CYAN", "BOX-RED", "BOX-PURPLE", "BOX-GOLD", "BOX-LIGHT_GRAY",
]

/**
 * @param {HTMLElement} box 
 */
function updateBox(box) {
    box.style.left = (Math.floor(Math.random()*320-64)*8) + "px";
    box.style.top = (Math.floor(Math.random()*160-64)*16) + "px";
    box.style.width = (Math.floor(Math.random()*8+2)*8 - 12) + "px";
    box.style.height = (Math.floor(Math.random()*8+1)*16) + "px";
    box.style.zIndex = -Math.floor(Math.random()*32);
    for (let color of COLORS) {
        box.classList.remove(color);
    }
    box.classList.add(COLORS[Math.floor(Math.random()*COLORS.length)]);
}

document.addEventListener("DOMContentLoaded", () => {
    for (let i = 0; i < NUM_BOXES; i++) {
        let box = document.createElement("box");
        box.classList.add("bgbox");
        updateBox(box);
        document.getElementById("boxes").appendChild(box);
        boxes.push(box);
    }
    setInterval(() => {
        let box = boxes.shift();
        boxes.push(box);
        updateBox(box);
    }, 1000/20);
})
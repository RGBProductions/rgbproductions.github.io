import { RChart } from "./rcf.js";
import { VSChart } from "./vsb.js";

/** @type {VSChart?} */
let vsb = undefined;

const vsbNoteTypeMap = {0:1, 1:3, 2:2, 3:0, 4:undefined, 5:undefined, 6:4, 7:5, 8:3};

let canConvert = false;

function convert() {
    if (vsb) {
        let name = vsb.name.split(".");
        name.pop();
        name.push("rcf");
        let rcf = new RChart(undefined, name.join("."));
        
        for (let note of vsb.notes) {
            let t = vsbNoteTypeMap[note.type];
            if (t != undefined) {
                rcf.notes.push({type: t, time: note.time, lane: note.lane, extra: note.extra});
            }
        }

        // TODO: Add mods once Recur and RCF support them

        rcf.write();
    }
}

/** @type {HTMLInputElement} */
let inp = document.getElementById("fileinput");

/** @type {HTMLButtonElement} */
let button = document.getElementById("convertbtn");

inp.addEventListener("change", (e) => {
    let file = inp.files[0];
    vsb = undefined;
    button.disabled = true;
    file.arrayBuffer().then(buf => {
        if (file.name.endsWith(".vsb")) {
            vsb = new VSChart(new Uint8Array(buf), file.name);
            if (!vsb.isValid) {
                vsb = undefined;
            } else {
                button.disabled = false;
                return;
            }
        }
        alert("Provided chart is not supported!\n\nPlease provide one of:\nvivid/stasis Binary (.vsb)");
    })
})

window.convert = convert;
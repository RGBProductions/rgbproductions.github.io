import { VSChart } from "./vsb.js";

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("main");
const context = canvas.getContext("2d");

const spritesheet = new Image();
spritesheet.src = "images.png";

let imagesAvailable = false;
spritesheet.addEventListener("load", () => {
    imagesAvailable = true;
})

const spriteDefinition = (sx,sy,sw,sh) => ((x,y,w=sw,h=sh) => context.drawImage(spritesheet, sx, sy, sw, sh, x, y, w, h));

const sprites = {
    lanes: spriteDefinition(1, 1, 93, 180),
    holdOverlay: spriteDefinition(95, 1, 93, 36),
    noteChipL: spriteDefinition(95, 54, 22, 7),
    noteChipR: spriteDefinition(118, 54, 22, 7),
    noteHoldL: spriteDefinition(95, 46, 22, 7),
    noteHoldR: spriteDefinition(118, 46, 22, 7),
    noteBumperL: spriteDefinition(141, 38, 45, 7),
    noteBumperM: spriteDefinition(141, 46, 45, 7),
    noteBumperR: spriteDefinition(141, 54, 45, 7),
    noteTimedBumperL: spriteDefinition(141, 62, 45, 7),
    noteTimedBumperM: spriteDefinition(141, 125, 45, 7),
    noteTimedBumperR: spriteDefinition(141, 70, 45, 7),
    noteMine: spriteDefinition(118, 62, 22, 7),
    noteMineBumper: spriteDefinition(141, 78, 45, 7),
    selectBumpers: spriteDefinition(140, 94, 45, 7),
    selectTimedBumpers: spriteDefinition(140, 102, 45, 7),
    selectBPMEvent: spriteDefinition(95, 62, 22, 7),
    selectModEvent: spriteDefinition(140, 110, 22, 7),
    indicatorL: spriteDefinition(141, 86, 9, 7),
    indicatorM: spriteDefinition(151, 86, 9, 7),
    indicatorR: spriteDefinition(161, 86, 9, 7),
    arrow: spriteDefinition(171, 86, 4, 7),
    difficulty(diff, level, x, y, w=44, h=11) {
        context.drawImage(spritesheet, 95, 70+12*diff, 44, 11, x, y, w, h);
        let sx = w/44, sy = h/11;
        context.drawImage(spritesheet, 140, 118, 20, 5, x+3*sx, y+3*sy, 20*sx, 5*sy);
        if (level >= 1) context.drawImage(spritesheet, 189+Math.floor((Math.max(level, 9)%1)*2)*16, 1+Math.floor(level-1)*8, 15, 7, x+26*sx, y+2*sx, 15*sx, 7*sy);
    }
}

let mouseX = 0, mouseY = 0;

let selectedNoteType = 0;
let noteTypes = [0, 1, 8, 6, 7, 3];

let scrollSpeed = 10;
let zoom = 1;

let audio = new Audio();

let songInfo = {
    song_name: "Song Name",
    artist: "Artist"
}

/** @type {VSChart?} */
let chart = undefined;

function getNoteY(time) {
    return canvas.height-((time-audio.currentTime)*scrollSpeed*zoom*28+36)*scale;
}

let scale = 4;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
})

const clickable = (x,y,w,h,draw) => {
    let within = mouseX >= x && mouseX < x+w && mouseY >= y && mouseY < y+h;
    if (draw) {
        draw(x,y,w,h);
        if (within) canvas.style.cursor = "pointer";
    }
    return within;
}

let mouseSelectedTime = 0;
let mouseSelectedLane = 0;

let placingNote = undefined;

window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
})

let validLanes = [
    [0,1,2,3],
    [0,1,2],
    [0,1,2],
    [0,1,2,3],
    [0,1,2],
    [0,1,2,3],
    []
]

function MouseDown(x,y,b) {
    if (clickable(16*scale, (32)*scale, 22*scale, 7*scale)) { selectedNoteType = 0; return; }
    if (clickable(16*scale, (32+16)*scale, 45*scale, 7*scale)) { selectedNoteType = 1; return; }
    if (clickable(16*scale, (32+32)*scale, 45*scale, 7*scale)) { selectedNoteType = 2; return; }
    if (clickable(16*scale, (32+48)*scale, 22*scale, 7*scale)) { selectedNoteType = 3; return; }
    if (clickable(16*scale, (32+64)*scale, 45*scale, 7*scale)) { selectedNoteType = 4; return; }
    if (clickable(16*scale, (32+80)*scale, 22*scale, 7*scale)) { selectedNoteType = 5; return; }
    if (clickable(16*scale, (32+96)*scale, 22*scale, 7*scale)) { selectedNoteType = 6; return; }

    if (b == 0 && validLanes[selectedNoteType].includes(mouseSelectedLane)) {
        placingNote = {type: noteTypes[selectedNoteType], time: mouseSelectedTime*1000, lane: mouseSelectedLane, extra: {}};
    }

    if (b == 2) {
        for (let note of chart.notes) {
            if (clickNote(note.type,note.time,note.lane,note.extra)) {
                chart.notes.splice(chart.notes.indexOf(note), 1);
                break;
            }
        }
    }
}

function MouseUp(x,y,b) {
    if (placingNote) {
        if (placingNote.type == 2) {
            let time = Math.min(placingNote.time, placingNote.extra[1]);
            let endTime = Math.max(placingNote.time, placingNote.extra[1]);
            placingNote.time = time;
            placingNote.extra[1] = endTime;
        }
        chart.notes.push(placingNote);
        chart.notes.sort((a,b) => (a.time - b.time));
        placingNote = undefined;
    }
}

function clickNote(type,time,lane,extra) {
    let lanesX = (canvas.width-93*scale)/2;
    let y = getNoteY(time/1000);
    let x = lanesX+(lane*23+1)*scale;
    switch(type) {
        case 0:
        case 6: return clickable(x, y, 22*scale, 7*scale);

        case 1:
        case 7:
        case 8:
            return clickable(x, y, 45*scale, 7*scale);
        
        case 2: {
            let y2 = getNoteY(extra[1]/1000);
            return clickable(x, Math.min(y2,y)+7*scale, 22*scale, Math.abs(y2-y));
        }
        case 3:
            return clickable(lanesX-22*scale, y, 22*scale, 7*scale);
        default:
            return false;
    }
}

function drawNote(type, time, lane, extra) {
    let lanesX = (canvas.width-93*scale)/2;
    let y = getNoteY(time/1000);
    let x = lanesX+(lane*23+1)*scale;
    switch(type) {
        case 0: {
            if (lane < 2) {
                sprites.noteChipL(x, y, 22*scale, 7*scale);
            } else {
                sprites.noteChipR(x, y, 22*scale, 7*scale);
            }
            break;
        }
        case 6: {
            sprites.noteMine(x, y, 22*scale, 7*scale);
            break;
        }
        case 7: {
            sprites.noteMineBumper(x, y, 45*scale, 7*scale);
            break;
        }
        case 1: {
            if (lane == 0) {
                sprites.noteBumperL(x, y, 45*scale, 7*scale);
                sprites.indicatorL(lanesX - 9*scale, y, 9*scale, 7*scale);
            } else if (lane == 1) {
                sprites.noteBumperM(x, y, 45*scale, 7*scale);
                sprites.indicatorM(lanesX - 9*scale, y, 9*scale, 7*scale);
                sprites.indicatorM(lanesX+93*scale, y, 9*scale, 7*scale);
            } else if (lane == 2) {
                sprites.noteBumperR(x, y, 45*scale, 7*scale);
                sprites.indicatorR(lanesX+93*scale, y, 9*scale, 7*scale);
            }
            break;
        }
        case 8: {
            if (lane == 0) {
                sprites.noteTimedBumperL(x, y, 45*scale, 7*scale);
                sprites.indicatorL(lanesX - 9*scale, y, 9*scale, 7*scale);
            } else if (lane == 1) {
                sprites.noteTimedBumperM(x, y, 45*scale, 7*scale);
                sprites.indicatorM(lanesX - 9*scale, y, 9*scale, 7*scale);
                sprites.indicatorM(lanesX+93*scale, y, 9*scale, 7*scale);
            } else if (lane == 2) {
                sprites.noteTimedBumperR(x, y, 45*scale, 7*scale);
                sprites.indicatorR(lanesX+93*scale, y, 9*scale, 7*scale);
            }
            break;
        }
        case 2: {
            let y2 = getNoteY(extra[1]/1000);
            if (lane < 2) {
                sprites.noteHoldL(x, Math.min(y2,y)+7*scale, 22*scale, Math.abs(y2-y)-7*scale);
                sprites.noteChipL(x, y, 22*scale, 7*scale);
                sprites.noteChipL(x, y2+7*scale, 22*scale, 7*scale);
            } else {
                sprites.noteHoldR(x, Math.min(y2,y)+7*scale, 22*scale, Math.abs(y2-y)-7*scale);
                sprites.noteChipR(x, y, 22*scale, 7*scale);
                sprites.noteChipR(x, y2+7*scale, 22*scale, 7*scale);
            }
            break;
        }
        case 3: {
            sprites.selectBPMEvent(lanesX-22*scale, y, 22*scale, 7*scale);
            break;
        }
        default:
            break;
    }
}

function MainUpdate() {
    if (placingNote) {
        if (placingNote.type == 0 && mouseSelectedTime*1000 != placingNote.time) {
            placingNote.type = 2;
        }
        if (placingNote.type == 2 && mouseSelectedTime*1000 == placingNote.time) {
            placingNote.type = 0
        }
        if (placingNote.type == 2) {
            placingNote.extra[1] = mouseSelectedTime*1000;
        } else if (placingNote.extra[1]) {
            delete placingNote.extra[1];
        }
    }
}

function MainDraw() {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.textBaseline = "top";
    context.textAlign = "left";
    context.font = `${16*scale}px Monaco`;
    canvas.style.cursor = "default";

    if (imagesAvailable) {
        context.imageSmoothingEnabled = false;

        let lanesX = (canvas.width-93*scale)/2;

        sprites.lanes(lanesX, 0, 93*scale, canvas.height);

        if (chart && chart.isValid) {
            let beatTime = 0;
            let beatDivisor = 0;
            let beatStep = 1/zoom;
            let curBPM = chart.ce_initialBpm;
            let bpmChange = 1;

            mouseSelectedTime = 0;
            let closest = Infinity;

            while (true) {
                let change = chart.ce_bpmChanges[bpmChange] ?? {time: Infinity, extra: {[1]: 120}};
                let next = beatTime + beatStep/curBPM*15;
                if (next > change.time/1000) {
                    let remainder = (next-change.time/1000)/15*curBPM;
                    beatTime = change.time/1000;
                    curBPM = change.extra[1];
                    bpmChange ++;
                    next = beatTime + remainder/curBPM*15;
                }
                beatTime = next;
                beatDivisor += beatStep;
                let y = getNoteY(beatTime);
                if (Math.abs(mouseY-y) < closest) {
                    closest = Math.abs(mouseY-y);
                    mouseSelectedTime = beatTime;
                }
                if (y < -4) break;

                beatDivisor %= 4;

                if (y <= canvas.height) {
                    context.beginPath();
                    context.moveTo(lanesX, y);
                    context.lineTo(lanesX+93*scale, y);
                    context.lineWidth = scale;
                    context.strokeStyle = beatDivisor == 0 ? "#FFFFFF80" : "#FFFFFF20";
                    context.stroke();
                }
            }
        }

        mouseSelectedLane = Math.floor((mouseX-lanesX)/(23*scale));

        sprites.holdOverlay((canvas.width-93*scale)/2, canvas.height-36*scale, 93*scale, 36*scale);
        if (chart && chart.isValid) {            
            for (let note of chart.notes) {
                drawNote(note.type, note.time, note.lane, note.extra);
            }

            if (mouseSelectedLane >= 0 && mouseSelectedLane <= 3) {
                let mouseSelectedType = noteTypes[selectedNoteType];
                drawNote(mouseSelectedType, mouseSelectedTime*1000, mouseSelectedLane, {});
            }

            if (placingNote) drawNote(placingNote.type, placingNote.time, placingNote.lane, placingNote.extra);
        }

        context.fillStyle = "#000000";
        context.fillRect(0, canvas.height-15*scale, canvas.width, 15*scale);
        clickable(
            canvas.width - 46*scale,
            canvas.height - 13*scale,
            44*scale,
            11*scale,
            (x,y,w,h) => sprites.difficulty(5,0,x,y,w,h)
        );

        context.fillStyle = "#ffffff";
        context.fillText("Notes", 8*scale, 8*scale);
        clickable(16*scale, (32)*scale, 22*scale, 7*scale, sprites.noteChipL);
        clickable(16*scale, (32+16)*scale, 45*scale, 7*scale, sprites.selectBumpers);
        clickable(16*scale, (32+32)*scale, 45*scale, 7*scale, sprites.selectTimedBumpers);
        clickable(16*scale, (32+48)*scale, 22*scale, 7*scale, sprites.noteMine);
        clickable(16*scale, (32+64)*scale, 45*scale, 7*scale, sprites.noteMineBumper);
        clickable(16*scale, (32+80)*scale, 22*scale, 7*scale, sprites.selectBPMEvent);
        clickable(16*scale, (32+96)*scale, 22*scale, 7*scale, sprites.selectModEvent);
        sprites.arrow(8*scale, (32+selectedNoteType*16)*scale, 4*scale, 7*scale);

        context.fillText(`Song time: ${audio.currentTime} s`, 64*scale, 8*scale);
        context.fillText(`Zoom level: ${zoom}x`, 64*scale, 20*scale);
    }

    context.textBaseline = "bottom";
    context.fillStyle = "#ff0000";
    if (!audio.src) {
        context.fillText("Please provide an audio file!", 8*scale, canvas.height-15*scale);
    }
    if (!chart) {
        context.fillText("Please provide a chart file (or press shift+n)!", 8*scale, canvas.height-15*scale-16*scale);
    }

    let nameMetric = context.measureText(songInfo.song_name);
    let slashMetric = context.measureText(" / ");
    let fullMetric = context.measureText(`${songInfo.song_name} / ${songInfo.artist}`);
    context.textBaseline = "top";
    context.textAlign = "left";
    clickable(3*scale, canvas.height-15*scale, fullMetric.width, 15*scale, (x,y,w,h) => {
        let nameGradient = context.createLinearGradient(x, y, x, y+h);
        let artistGradient = context.createLinearGradient(x, y, x, y+h);
        nameGradient.addColorStop(0, "#FF006E");
        nameGradient.addColorStop(1, "#D800FF");
        artistGradient.addColorStop(0, "#B200FF");
        artistGradient.addColorStop(1, "#1F1FFF");

        context.fillStyle = nameGradient;
        context.fillText(songInfo.song_name, x, y-2*scale);
        context.fillStyle = "#ffffff";
        context.fillText(" / ", x+nameMetric.width, y-2*scale);
        context.fillStyle = artistGradient;
        context.fillText(songInfo.artist, x+nameMetric.width+slashMetric.width, y-2*scale);
        context.fillStyle = "#ffffff";
    })

    context.fillStyle = "#ffffff80";
    context.textBaseline = "top";
    context.textAlign = "right";
    context.fillText(`V/SCC v0.0.0`, canvas.width-8*scale, 8*scale);
}

function MainLoop() {
    MainDraw();
    MainUpdate();
    requestAnimationFrame(MainLoop);
}

requestAnimationFrame(MainLoop);

window.addEventListener("mousedown", (e) => {
    MouseDown(e.clientX, e.clientY, e.button);
})

window.addEventListener("mouseup", (e) => {
    MouseUp(e.clientX, e.clientY, e.button);
})

window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
})

window.addEventListener("dragover", (e) => {
    e.preventDefault();
})

window.addEventListener("drop", (e) => {
    e.preventDefault();

    let file = e.dataTransfer.files[0];
    let reader = new FileReader();
    reader.addEventListener("load", (data) => {
        if (file.name.endsWith(".vsb")) {
            chart = new VSChart(new Uint8Array(data.target.result));
        }
        if (file.type.startsWith("audio/")) {
            let url = URL.createObjectURL(file);
            audio.src = url;
        }
    })
    reader.readAsArrayBuffer(file);
})

window.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.ctrlKey) {
        zoom = Math.max(1, Math.min(16, zoom - Math.sign(e.deltaY)));
    } else {
        audio.currentTime -= e.deltaY/1000/zoom;
    }
}, {passive: false});

window.addEventListener("keydown", (e) => {
    let k = e.key.toLowerCase();
    if (k == " ") {
        e.preventDefault();
        if (!audio.src) return;
        if (audio.paused)
            audio.play();
        else
            audio.pause();
    }
    if (k == "s" && e.ctrlKey) {
        e.preventDefault();
        chart.write();
    }
    if (k == "n" && e.shiftKey) {
        e.preventDefault();
        chart = new VSChart();
    }
})
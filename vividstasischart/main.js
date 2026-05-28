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
let beatSnaps = 4;

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

let offset = 0;

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
let tempoChange = undefined;
let tempo = "120";

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

    if (b == 0) {
        if (tempoChange) {
            let w = 128, h = 96;

            if (clickable((canvas.width - w*scale)/2 + 4*scale, (canvas.height+h*scale)/2 - 16*scale - 4*scale, 56*scale, 16*scale)) {
                tempoChange.extra[1] = parseFloat(tempo);
                if (tempoChange == chart.ce_bpmChanges[0]) chart.ce_initialBpm = tempoChange.extra[1];
                tempoChange = undefined;
                chart.updateBpmChangeTimes();
                chart.updateModTimes();
                return;
            }
            if (clickable((canvas.width + w*scale)/2 - 64*scale + 4*scale, (canvas.height+h*scale)/2 - 16*scale - 4*scale, 56*scale, 16*scale)) {
                tempoChange = undefined;
                return;
            }
            return;
        }


        if (clickable(64*scale, 20*scale + 16*scale, 11*scale, 11*scale)) {
            zoom = Math.max(1, zoom-1);
        }
        if (clickable(64*scale+16*scale, 20*scale + 16*scale, 11*scale, 11*scale)) {
            zoom = Math.min(16, zoom+1);
        }
        if (clickable(64*scale, 45*scale + 16*scale, 11*scale, 11*scale)) {
            beatSnaps = Math.max(1, beatSnaps-1);
        }
        if (clickable(64*scale+16*scale, 45*scale + 16*scale, 11*scale, 11*scale)) {
            beatSnaps = Math.min(16, beatSnaps+1);
        }

        if (chart && chart.isValid) {
            for (let change of chart.ce_bpmChanges) {
                if (clickNote(change.type, change.time, change.lane, change.extra)) {
                    tempoChange = change;
                    tempo = tempoChange.extra[1].toString();
                    return;
                }
            }
            if (validLanes[selectedNoteType].includes(mouseSelectedLane)) {
                placingNote = {type: noteTypes[selectedNoteType], time: mouseSelectedTime*1000, lane: mouseSelectedLane, extra: {}};
            }
        }
    }

    if (b == 2) {
        for (let note of chart.notes) {
            if (clickNote(note.type,note.time,note.lane,note.extra)) {
                chart.notes.splice(chart.notes.indexOf(note), 1);
                let changeIndex = chart.ce_bpmChanges.indexOf(note);
                if (changeIndex != -1) chart.ce_bpmChanges.splice(changeIndex, 1);
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
        if (placingNote.type == 3) {
            placingNote.lane = 0;
            placingNote.extra[1] = 120;
            tempoChange = placingNote;
            tempo = tempoChange.extra[1].toString();
            chart.ce_bpmChanges.push(tempoChange);
            chart.ce_bpmChanges.sort((a,b) => (a.time-b.time));
            if (tempoChange == chart.ce_bpmChanges[0]) chart.ce_initialBpm = tempoChange.extra[1];
            chart.updateBpmChangeTimes();
            chart.updateModTimes();
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
                sprites.noteHoldL(x, Math.min(y2,y)+7*scale, 22*scale, Math.abs(y2-y)-4*scale);
                sprites.noteChipL(x, y, 22*scale, 7*scale);
                sprites.noteChipL(x, y2+7*scale, 22*scale, 7*scale);
            } else {
                sprites.noteHoldR(x, Math.min(y2,y)+7*scale, 22*scale, Math.abs(y2-y)-4*scale);
                sprites.noteChipR(x, y, 22*scale, 7*scale);
                sprites.noteChipR(x, y2+7*scale, 22*scale, 7*scale);
            }
            break;
        }
        case 3: {
            sprites.selectBPMEvent(lanesX-22*scale, y, 22*scale, 7*scale);
            if (extra[1]) {
                context.fillStyle = "#ffffff";
                context.textAlign = "right";
                context.textBaseline = "top";
                context.fillText(extra[1], lanesX-26*scale, y-6*scale);
            }
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
            let beatStep = (4/beatSnaps)/zoom;
            let beatDivisor = -beatStep;
            let curBPM = chart.ce_initialBpm;
            if (curBPM <= 0) curBPM = 120;
            let bpmChange = 1;
            let beatTime = -beatStep/curBPM*15 + offset;

            mouseSelectedTime = 0;
            let closest = Infinity;

            while (true) {
                let change = chart.ce_bpmChanges[bpmChange] ?? {time: Infinity, extra: {[1]: 120}};
                let next = beatTime + beatStep/curBPM*15;
                if (next > change.time/1000) {
                    let remainder = (next-change.time/1000)/15*curBPM;
                    beatTime = change.time/1000;
                    if (change.extra[1] > 0) curBPM = change.extra[1];
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
                    context.strokeStyle = beatDivisor <= 0.05 ? "#FFFFFF80" : "#FFFFFF20";
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

            if (chart.mods) {
                let stacked = {};
                context.fillStyle = "#ffffff";
                context.textAlign = "left";
                context.textBaseline = "top";
                for (let mod of chart.mods.mods) {
                    if (!(mod.b in stacked)) {
                        stacked[mod.b] = {time: mod.time, mods: []};
                    }
                    stacked[mod.b].mods.push(mod.m);
                }
                for (let [time,obj] of Object.entries(stacked)) {
                    let y = getNoteY(obj.time);
                    let hovered = clickable(lanesX+93*scale, y, 22*scale, 7*scale, sprites.selectModEvent);
                    let txt = obj.mods.join(", ");
                    let metric = context.measureText(txt);
                    let collapsed = false;
                    if (lanesX+119*scale+metric.width >= canvas.width) {
                        txt = `${obj.mods.length} mods`;
                        collapsed = true;
                    }
                    if (hovered && collapsed) {
                        let i = 0;
                        let dir = y-6*scale+8*scale*(obj.mods.length+1) >= canvas.height-15*scale ? -1 : 1;
                        for (let mod of obj.mods) {
                            context.fillText(mod, lanesX+119*scale, y-6*scale+8*scale*i*dir);
                            i++;
                        }
                    } else {
                        context.fillText(txt, lanesX+119*scale, y-6*scale);
                    }
                }
            }
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

        context.textBaseline = "top";
        context.textAlign = "left";

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

        context.fillText(`Song time: ${Math.floor(audio.currentTime*1000)/1000} s`, 64*scale, 8*scale);
        context.fillText(`Zoom level: ${zoom}x`, 64*scale, 20*scale);
        context.fillText(`Subdivisions: ${beatSnaps}`, 64*scale, 45*scale);
        context.strokeStyle = "#ffffff";
        context.lineWidth = scale;
        context.textBaseline = "middle";
        context.textAlign = "center";
        
        context.fillStyle = zoom == 1 ? "#404040" : "#ffffff";
        context.strokeStyle = context.fillStyle;
        clickable(64*scale, 20*scale + 16*scale, 11*scale, 11*scale, (x,y,w,h) => {context.strokeRect(x,y,w,h); context.fillText("-", x+6*scale, y+4.5*scale)});
        context.fillStyle = zoom == 16 ? "#404040" : "#ffffff";
        context.strokeStyle = context.fillStyle;
        clickable(64*scale+16*scale, 20*scale + 16*scale, 11*scale, 11*scale, (x,y,w,h) => {context.strokeRect(x,y,w,h); context.fillText("+", x+6*scale, y+4.5*scale)});
        
        context.fillStyle = beatSnaps == 1 ? "#404040" : "#ffffff";
        context.strokeStyle = context.fillStyle;
        clickable(64*scale, 45*scale + 16*scale, 11*scale, 11*scale, (x,y,w,h) => {context.strokeRect(x,y,w,h); context.fillText("-", x+6*scale, y+4.5*scale)});
        context.fillStyle = beatSnaps == 16 ? "#404040" : "#ffffff";
        context.strokeStyle = context.fillStyle;
        clickable(64*scale+16*scale, 45*scale + 16*scale, 11*scale, 11*scale, (x,y,w,h) => {context.strokeRect(x,y,w,h); context.fillText("+", x+6*scale, y+4.5*scale)});

        if (tempoChange) {
            let w = 128, h = 96;
            context.fillStyle = "#00000080";
            context.fillRect(0,0,canvas.width,canvas.height);
            context.fillStyle = "#000000";
            context.fillRect((canvas.width - w*scale)/2-2*scale, (canvas.height-h*scale)/2-2*scale, (w+4)*scale, (h+4)*scale);
            context.strokeStyle = "#ffffff";
            context.strokeRect((canvas.width - w*scale)/2, (canvas.height-h*scale)/2, w*scale, h*scale);
            context.fillStyle = "#ffffff";
            context.textBaseline = "top";
            context.textAlign = "center";
            context.fillText(`Tempo Change`, canvas.width/2, (canvas.height-h*scale)/2);
            context.textBaseline = "bottom";
            context.fillText(`New Tempo`, canvas.width/2, canvas.height/2);
            context.textBaseline = "top";
            context.fillText(tempo, canvas.width/2, canvas.height/2);
            context.beginPath();
            context.moveTo((canvas.width-64*scale)/2, canvas.height/2+15*scale);
            context.lineTo((canvas.width+64*scale)/2, canvas.height/2+15*scale);
            context.stroke();
            context.textBaseline = "middle";
            context.textAlign = "center";
            clickable((canvas.width - w*scale)/2 + 4*scale, (canvas.height+h*scale)/2 - 16*scale - 4*scale, 56*scale, 16*scale, (x,y,w,h) => context.strokeRect(x,y,w,h));
            clickable((canvas.width + w*scale)/2 - 64*scale + 4*scale, (canvas.height+h*scale)/2 - 16*scale - 4*scale, 56*scale, 16*scale, (x,y,w,h) => context.strokeRect(x,y,w,h));
            context.fillText("Confirm", (canvas.width-w*scale)/2 + 4*scale + 28*scale, (canvas.height+h*scale)/2 - 16*scale - 4*scale + 8*scale);
            context.fillText("Cancel", (canvas.width + w*scale)/2 - 64*scale + 4*scale + 28*scale, (canvas.height+h*scale)/2 - 16*scale - 4*scale + 8*scale);
        }
    }

    context.textBaseline = "bottom";
    context.textAlign = "left";
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
    context.fillText(`V/SCC v0.0.5`, canvas.width-8*scale, 8*scale);
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
            window.chart = chart;
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
    } else if (e.shiftKey) {
        beatSnaps = Math.max(1, Math.min(16, beatSnaps - Math.sign(e.deltaY)));
    } else {
        audio.currentTime -= e.deltaY/1000/zoom;
    }
}, {passive: false});

window.addEventListener("keydown", (e) => {
    let k = e.key.toLowerCase();
    if (tempoChange) {
        let num = parseInt(k);
        if (num == num || k == ".") {
            tempo += k;
        }
        if (k == "backspace") {
            tempo = tempo.substring(0,tempo.length-1);
        }
    }
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
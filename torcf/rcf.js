// credit zuzaratrust for RCF format

import { getModNameFromByte, modWeight } from "./mods.js";

const buffer_u8 = 1;
const buffer_s8 = 2;
const buffer_u16 = 3;
const buffer_s16 = 4;
const buffer_u32 = 5;
const buffer_s32 = 6;
const buffer_f16 = 7;
const buffer_f32 = 8;
const buffer_f64 = 9;
const buffer_bool = 10;
const buffer_string = 11;
const buffer_u64 = 12;
const buffer_text = 13;

const NoteDataFlag = {
    END: 159,
    TYPE: 0,
    LANE: 1,
    TIME: 2,
    EXTRA: 160,
    EXTRA_END: 161
}

const ChartDataFlag = {
    NOTE: 158,
    MODS: 224,
    MODS_END: 225,
    GIMMICK: 226,
    GIMMICK_END: 227,
    MOD_PROXIES: 228,
    MOD_OBJ: 229,
    MOD: 233,
    PERFRAME: 236,
    END: 255
}

// why?? -RGBDev
function typeToBufferType(t) {
    switch (t)
    {
        case 1:
            return buffer_f32;
    }
}

let easeBytes = {
    linear: 1,
    outElastic: 2,
    inExpo: 3,
    outExpo: 4,
    inOutExpo: 5,
    inQuad: 6,
    outQuad: 7,
    inOutQuad: 8,
    inCubic: 9,
    outCubic: 10,
    inOutCubic: 11,
    outBack: 12,
    inSine: 13,
    outSine: 14,
    inOutSine: 15,
    outQuart: 16,
    inOutCirc: 17,
    inCirc: 18,
    outCirc: 19
}

function getEaseFromByte(b) {
    return Object.keys(easeBytes)[Object.values(easeBytes).indexOf(b)];
}

function getByteFromEase(e) {
    return easeBytes[e];
}

function readNote(buffer) {
    let note = {time: 0, lane: 0, type: 0, extra: {}};

    while (true) {
        let flag = buffer.read(buffer_u8);
        switch(flag) {
            case NoteDataFlag.TYPE:
                note.type = buffer.read(buffer_u8);
                break;
            case NoteDataFlag.LANE:
                note.lane = buffer.read(buffer_u8);
                break;
            case NoteDataFlag.TIME:
                note.time = buffer.read(buffer_f32);
                break;
            case NoteDataFlag.EXTRA:
                while (true) {
                    let t = buffer.read(buffer_u8);
                    if (t == NoteDataFlag.EXTRA_END) break;
                    let value = buffer.read(typeToBufferType(t));
                    note.extra[t] = value;
                    console.log(`extra ${t} = ${value}`)
                }
                break;
        }
        if (flag == NoteDataFlag.END) break;
    }
    return note;
}

class RChartBuffer {
    /**
     * @param {Uint8Array} buffer 
     */
    constructor(buffer) {
        this.buffer = buffer;
        this.view = new DataView(buffer.buffer);
        this.pointer = 0;
    }

    read(t) {
        switch(t) {
            case buffer_u8: return this.view.getUint8(this.pointer++);
            case buffer_s8: return this.view.getInt8(this.pointer++);
            case buffer_u16: {
                let v = this.view.getUint16(this.pointer, true);
                this.pointer += 2;
                return v;
            }
            case buffer_s16: {
                let v = this.view.getInt16(this.pointer, true);
                this.pointer += 2;
                return v;
            }
            case buffer_u32: {
                let v = this.view.getUint32(this.pointer, true);
                this.pointer += 4;
                return v;
            }
            case buffer_s32: {
                let v = this.view.getInt32(this.pointer, true);
                this.pointer += 4;
                return v;
            }
            case buffer_f16: throw new Error("16-bit floating point numbers are not currently supported");
            case buffer_f32: {
                let v = this.view.getFloat32(this.pointer, true);
                this.pointer += 4;
                return v;
            }
            case buffer_f64: {
                let v = this.view.getFloat64(this.pointer, true);
                this.pointer += 4;
                return v;
            }
            case buffer_bool: return this.view.getUint8(this.pointer++) != 0;
            case buffer_u64: throw new Error("64-bit unsigned integers are not currently supported");
            case buffer_string:
                let s = "";
                while (true) {
                    let v = this.view.getUint8(this.pointer++);
                    if (v == 0) break;
                    s += String.fromCharCode(v);
                }
                return s;
            case buffer_text: throw new Error("Text cannot be read");
            default: throw new Error("Cannot read data type " + t);
        }
    }
}

export function putFloat32(buf, v) {
    let view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, v, true);
    buf.push(view.getUint8(0));
    buf.push(view.getUint8(1));
    buf.push(view.getUint8(2));
    buf.push(view.getUint8(3));
}

export function putUint32(buf, v) {
    let view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, v, true);
    buf.push(view.getUint8(0));
    buf.push(view.getUint8(1));
    buf.push(view.getUint8(2));
    buf.push(view.getUint8(3));
}

/**
 * @param {Array} buf 
 * @param {string} v 
 */
export function putString(buf, v) {
    for (let i = 0; i < v.length; i++) {
        buf.push(v.charCodeAt(i));
    }
    buf.push(0);
}

export function beatToTime(bpmList, beat) {
    let l = 0;
    let r = bpmList.length-1;
    while (l < r) {
        let mid = Math.floor((l+r+1)/2);
        if (beat < bpmList[mid].start_beat)
            r = mid-1;
        else
            l = mid;
    }
    return bpmList[l].start_time/1000 + (((beat - bpmList[l].start_beat) / bpmList[l].bpm) * 60);
}

export function timeToBeat(bpmList, time) {
    let l = 0;
    let r = bpmList.length-1;
    while (l < r) {
        let mid = Math.floor((l+r+1)/2);
        if (time < bpmList[mid].start_time/1000)
            r = mid-1;
        else
            l = mid;
    }
    return bpmList[l].start_beat + (((time - bpmList[l].start_time/1000) * bpmList[l].bpm) / 60);
}

export class RChart {
    /**
     * @param {Uint8Array?} buffer 
     */
    constructor(buffer, name, path) {
        this.path = path;
        this.name = name;
        this.isValid = true;
        this.notes = [];
        this.mods = undefined;

        this.ce_bpmChanges = [];
        this.ce_initialBpm = 120;

        if (buffer) {
            let vbuf = new RChartBuffer(buffer);

            this.isValid = false;
            let header = String.fromCharCode(vbuf.read(1),vbuf.read(1),vbuf.read(1));
            if (header != "RCF") return;

            let typever = vbuf.read(buffer_u8);

            let noteCount = vbuf.read(buffer_u32);

            for (let i = 0; i < noteCount; i++) {
                let flag = vbuf.read(buffer_u8);
                if (flag == ChartDataFlag.NOTE) {
                    let note = readNote(vbuf);
                    this.notes.push(note);
                    if (note.type == 0) {
                        this.ce_bpmChanges.push(note);
                    }
                }
            }

            this.ce_initialBpm = (this.ce_bpmChanges[0] ?? {extra: {}}).extra[1] ?? 120;
            this.isValid = true;
            if (this.mods) this.mods.mods.sort((a,b) => a.b-b.b);
            this.updateBpmChangeTimes();
            this.updateModTimes();
        }
    }

    updateBpmChangeTimes() {
        let bpm = this.ce_initialBpm;
        let lastBpmChangeTime = 0;
        let lastBpmChangeBeats = 0;
        for (let change of this.ce_bpmChanges) {
            let newBpm = change.extra[1] ?? bpm;
            if (newBpm != undefined) {
                let oldBeatDuration = 60000/bpm;
                let beatsSinceChange = (change.time - lastBpmChangeTime) / oldBeatDuration;
                let totalBeats = beatsSinceChange + lastBpmChangeBeats;
                change.start_time = change.time;
                change.start_beat = totalBeats;
                change.bpm = newBpm;
                bpm = newBpm;
                lastBpmChangeBeats = totalBeats;
                lastBpmChangeTime = change.time;
            }
        }
    }

    updateModTimes() {
        if (!this.mods) return;
        for (let mod of this.mods.mods) {
            mod.time = beatToTime(this.ce_bpmChanges, mod.b);
        }
    }

    updateModBeats() {
        if (!this.mods) return;
        for (let mod of this.mods.mods) {
            mod.b = timeToBeat(this.ce_bpmChanges, mod.time);
        }
    }

    toBytes() {
        let bytes = [0x52,0x43,0x46,0x01];

        putUint32(bytes, this.notes.length);
        for (let note of this.notes) {
            bytes.push(ChartDataFlag.NOTE);
            bytes.push(NoteDataFlag.TYPE);
            bytes.push(note.type);
            bytes.push(NoteDataFlag.LANE);
            bytes.push(note.lane);
            bytes.push(NoteDataFlag.TIME);
            putFloat32(bytes, note.time);

            if ((note.type == 0 || note.type == 2 || note.type == 6) && note.extra[1] != undefined) {
                bytes.push(NoteDataFlag.EXTRA);
                bytes.push(1);
                putFloat32(bytes, note.extra[1]);
                bytes.push(NoteDataFlag.EXTRA_END);
            }
            bytes.push(NoteDataFlag.END);
        }
        return bytes;
    }

    async write(asNew) {
        let buf = new Uint8Array(this.toBytes());

        if (window.electron) {
            let path = this.path;
            if (asNew || !path) {
                path = await(electron.saveChartAs(this));
                if (!path) return false;
            }
            electron.writeFile(path, buf);
            this.path = path;
            return true;
        } else {
            let blob = new Blob([buf]);
            let saver = document.createElement("a");
            let url = URL.createObjectURL(blob);
            saver.href = url;
            saver.download = this.name;
            document.body.appendChild(saver);
            saver.click();
            saver.remove();
            URL.revokeObjectURL(url);
            return true;
        }
    }
}
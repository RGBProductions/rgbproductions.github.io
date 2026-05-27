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
    END: 161,
    TYPE: 162,
    LANE: 163,
    TIME: 164,
    EXTRA: 166,
    EXTRA_END: 167
}

const ChartDataFlag = {
    NOTE: 160,
    NOTES: 192,
    NOTES_END: 193,
    MODS: 224,
    MODS_END: 225,
    MOD: 226,
    END: 255
}

// why??
function typeToBufferType(t) {
    switch (t)
    {
        case 3:
        case 6:
        case 176:
            return buffer_u8;
        case 177:
            return buffer_s8;
        case 178:
            return buffer_u32;
        case 179:
            return buffer_s32;
        case 181:
            return buffer_f16;
        case 1:
        case 2:
        case 4:
        case 5:
        case 182:
            return buffer_f32;
        case 183:
            return buffer_bool;
        case 184:
            return buffer_string;
        case 7:
            return buffer_s8;
    }
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

                    let id = buffer.read(buffer_u8);
                    let value = buffer.read(typeToBufferType(t));
                    note.extra[id] = value;
                }
                break;
        }
        if (flag == NoteDataFlag.END) break;
    }
    return note;
}

class VSChartBuffer {
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

function putFloat32(buf, v) {
    let view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, v, true);
    buf.push(view.getUint8(0));
    buf.push(view.getUint8(1));
    buf.push(view.getUint8(2));
    buf.push(view.getUint8(3));
}

export class VSChart {
    /**
     * @param {Uint8Array?} buffer 
     */
    constructor(buffer) {
        this.isValid = true;
        this.notes = [];
        this.mods = [];

        this.ce_bpmChanges = [];
        this.ce_initialBpm = 120;

        if (buffer) {
            let vbuf = new VSChartBuffer(buffer);

            this.isValid = false;
            let header = String.fromCharCode(vbuf.read(1),vbuf.read(1),vbuf.read(1));
            if (header != "VSC") return;

            vbuf.read(buffer_u8);
            vbuf.read(buffer_u8);

            while (true) {
                let flag = vbuf.read(buffer_u8);

                if (flag == ChartDataFlag.NOTES) {
                    while (true) {
                        let flag2 = vbuf.read(buffer_u8);
                        if (flag2 == ChartDataFlag.NOTE) {
                            let note = readNote(vbuf);
                            this.notes.push(note);
                            if (note.type == 3) {
                                if (this.ce_bpmChanges.length == 0) this.ce_initialBpm = note.extra[1];
                                this.ce_bpmChanges.push(note);
                            }
                        } else if (flag2 == ChartDataFlag.NOTES_END) break;
                    }
                }
                if (flag == ChartDataFlag.MODS) {
                    // TODO: Parse mods
                    while (true) {
                        let flag2 = vbuf.read(buffer_u8);
                        if (flag2 == ChartDataFlag.MOD) {
                        }
                        if (flag2 == ChartDataFlag.MODS_END) break;
                    }
                }
                if (flag == ChartDataFlag.END) break;
            }

            this.isValid = true;
        }
    }

    async write() {
        let bytes = [0x56,0x53,0x43,0x01,0x00];

        bytes.push(ChartDataFlag.NOTES);
        for (let note of this.notes) {
            bytes.push(ChartDataFlag.NOTE);
            bytes.push(NoteDataFlag.TYPE);
            bytes.push(note.type);
            bytes.push(NoteDataFlag.LANE);
            bytes.push(note.lane);
            bytes.push(NoteDataFlag.TIME);
            putFloat32(bytes, note.time);

            if (note.type == 3 || note.type == 2) {
                bytes.push(NoteDataFlag.EXTRA);
                bytes.push(182);
                bytes.push(1);
                putFloat32(bytes, note.extra[1]);
                bytes.push(NoteDataFlag.EXTRA_END);
            }
            bytes.push(NoteDataFlag.END);
        }
        bytes.push(ChartDataFlag.NOTES_END);
        bytes.push(ChartDataFlag.END);
        
        let blob = new Blob([new Uint8Array(bytes)]);
        let url = URL.createObjectURL(blob);
        let saver = document.createElement("a");
        saver.href = url;
        saver.download = "CHART.vsb";
        document.body.appendChild(saver);
        saver.click();
        saver.remove();
        URL.revokeObjectURL(url);
    }
}
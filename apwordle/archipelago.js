/** @type {WebSocket} */
let socket;

let connected = false;
let waiting = false;
let ready = false;

let uuid = localStorage.getItem("ap-uuid") ?? crypto.randomUUID();
localStorage.setItem("ap-uuid", uuid);

let connectQueue;

/** @type {{[game: string]: {checksum: string, item_name_to_id: {[name: string]: number}, location_name_to_id: {[name: string]: number}, item_id_to_name: {[id: number]: string}, location_id_to_name: {[id: number]: string}}}} */
let datapacks = {};
let players = {};
let mySlot = 0;
let missingLocations = [];

function setDataPackage(game, data) {
    data.item_id_to_name = {};
    data.location_id_to_name = {};
    for (let [name,id] of Object.entries(data.item_name_to_id ?? {})) {
        data.item_id_to_name[id] = name;
    }
    for (let [name,id] of Object.entries(data.location_name_to_id ?? {})) {
        data.location_id_to_name[id] = name;
    }
    datapacks[game] = data;
}

export class Archipelago {
    static connect(host, port) {
        if (socket) return;

        socket = new WebSocket(`ws://${host}:${port}`);
        connected = false;

        let wasSecure = false;

        let onopen = (e) => {
            connected = true;
            waiting = false;
            mySlot = 0;
            players = {};
        }

        let onclose = (e) => {
            if (!connected) {
                if (!wasSecure) {
                    console.log("Insecure connection failed, trying secure");
                    wasSecure = true;
                    socket = new WebSocket(`wss://${host}:${port}`);
                    setup(socket);
                } else {
                    console.error("Socket connection failed");
                    socket = undefined;
                }
            } else {
                console.log("Socket closed gracefully");
                socket = undefined;
            }
        }

        let onmessage = async (e) => {
            let message = JSON.parse(e.data);
            console.log(message);
            let response = [];
            for (let command of message) {
                if (command.cmd == "RoomInfo") {
                    if (connectQueue) {
                        socket.send(JSON.stringify([connectQueue]));
                    }
                    waiting = true;

                    let dpGames = [];
                    for (let [game,sum] of Object.entries(command.datapackage_checksums)) {
                        let datapack = await electron.getAPData(game, sum);
                        if (datapack) {
                            setDataPackage(game, datapack);
                        } else {
                            console.log(`Missing or invalid data package for ${game}, must retrieve from server`);
                            dpGames.push(game);
                        }
                    }
                    if (dpGames.length > 0) {
                        response.push({
                            cmd: "GetDataPackage",
                            games: dpGames
                        })
                    }
                }
                if (command.cmd == "Connected") {
                    waiting = false;
                    ready = true;
                    missingLocations = command.missing_locations;
                    for (let player of command.players) {
                        players[player.slot] = {...player, slot_info: command.slot_info[player.slot]};
                    }
                    mySlot = command.slot;
                }
                if (command.cmd == "DataPackage") {
                    for (let [game,data] of Object.entries(command.data.games)) {
                        setDataPackage(game, data);
                        await electron.setAPData(game, data.checksum, data);
                    }
                }
            }
            if (response.length > 0) socket.send(JSON.stringify(response));
        }

        /**
         * @param {WebSocket} s 
         */
        function setup(s) {
            s.addEventListener("open", onopen);
            s.addEventListener("close", onclose);
            s.addEventListener("message", onmessage);
        }

        setup(socket);
    }

    static disconnect() {
        socket.close();
        socket = undefined;
        connected = false;
        ready = false;
        waiting = false;
    }

    static get socket() {
        return socket;
    }

    static connectSlot(name, password, game) {
        connectQueue = {
            cmd: "Connect",
            name: name,
            password: password ?? "",
            game: game ?? "",
            uuid: uuid,
            version: {major:0,minor:6,build:7,class:"Version"},
            items_handling: 0, // no items handling
            tags: ["HintGame"]
        };
        if (waiting) {
            socket.send(JSON.stringify([connectQueue]));
        }
    }

    static isItemReceived(item) {
        return received[item];
    }

    static chat(message) {
        if (!socket || socket.readyState != WebSocket.OPEN) return;

        socket.send(JSON.stringify([{
            cmd: "Say",
            text: message
        }]));
    }

    static getItemName(game, id) {
        if (!datapacks[game]) return undefined;
        return datapacks[game].item_id_to_name[id];
    }

    static getLocationName(game, id) {
        if (!datapacks[game]) return undefined;
        return datapacks[game].location_id_to_name[id];
    }

    static getPlayerName(id) {
        if (!players[id]) return undefined;
        return players[id].alias;
    }

    static getPlayerGame(id) {
        if (!players[id]) return undefined;
        return players[id].slot_info.game;
    }
    
    static get connected() {
        return ready;
    }

    static get missingLocation() {
        return missingLocations[Math.floor(Math.random()*missingLocations.length)];
    }

    static async scoutHint(location) {
        return new Promise((resolve, reject) => {
            socket.addEventListener("message", (e) => {
                let message = JSON.parse(e.data);
                for (let command of message) {
                    if (command.cmd == "LocationInfo") {
                        let i = missingLocations.indexOf(location);
                        if (i != -1) missingLocations.splice(i, 1);
                        resolve(command.locations);
                    }
                }
            }, {once: true});

            socket.send(JSON.stringify([{
                cmd: "LocationScouts",
                create_as_hint: 1,
                locations: [location]
            }]));
        })
    }

    static get slot() {
        return mySlot;
    }
}
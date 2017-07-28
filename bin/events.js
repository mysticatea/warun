/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

const EventEmitter = require("events")
const readline = require("readline")
const emitter = module.exports = new EventEmitter()

let rl = null
let ipcListener = null

/**
 * Emit SIGINT event.
 * @returns {void}
 */
function emitSIGINT() {
    if (rl) {
        rl.close()
        rl = null
    }
    if (ipcListener) {
        process.removeListener("message", ipcListener)
        ipcListener = null
    }

    emitter.emit("SIGINT")
}

// Normal.
process.on("SIGINT", emitSIGINT)

// For Windows.
if (process.platform === "win32") {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    rl.on("SIGINT", emitSIGINT)
}

// For tests on Windows.
if (process.connected) {
    process.on("message", (ipcListener = (message) => {
        if (message === "\u0003") {
            emitSIGINT()
        }
    }))
}

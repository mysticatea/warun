/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

const Buffer = require("buffer").Buffer
const path = require("path")
const Writable = require("stream").Writable
const spawn = require("cross-spawn")
const fs = require("fs-extra")
const BIN_PATH = path.resolve(__dirname, "../../bin/index.js")

/**
 * The stream to accumulate stream value.
 */
class AccumulateStream extends Writable {
    /**
     * Initialize this stream.
     * @param {string} name The name of this stream.
     */
    constructor(name) {
        super()
        this.name = name
        this.chunks = []
    }

    /**
     * The value of stream.
     * @type {string}
     */
    get value() {
        return Buffer.concat(this.chunks).toString()
    }

    /**
     * Handle the written values.
     * @param {string} chunk The chunk which was written.
     * @param {string} _encoding The encofing type.
     * @param {function} callback The callback to tell finished.
     * @returns {void}
     */
    _write(chunk, _encoding, callback) {
        this.chunks.push(chunk)
        callback()
    }
}

/**
 * The path to the test workspace directory.
 */
const WORKSPACE = module.exports.WORKSPACE = path.resolve(__dirname, "../../.test_workspace")

/**
 * The path to the test workspace directory.
 */
module.exports.PRINT_LATER = path.resolve(__dirname, "print-later.js")

/**
 * Wait for the given time.
 * @param {number} timeout The timeout in milliseconds.
 * @returns {Promise<void>} The promise which will get fulfilled after done.
 */
module.exports.delay = (timeout) => new Promise(resolve => setTimeout(resolve, timeout))

const OPTS = (process.platform === "win32")
    ? {stdio: ["pipe", "pipe", "pipe", "ipc"]}
    : {stdio: "pipe"}

/**
 * Execute `wr`.
 * @param {...string[]} args Arguments.
 * @returns {Promise<ChildProcess>} The promise which will get fulfilled after ready.
 */
module.exports.execWR = function execWR() {
    const args = [BIN_PATH]

    for (let i = 0; i < arguments.length; ++i) { //eslint-disable-line mysticatea/prefer-for-of
        args.push(arguments[i])
    }

    const cp = spawn("node", args, OPTS)
    const stdout = cp.stdout.pipe(new AccumulateStream("stdout"))
    const stderr = cp.stderr.pipe(new AccumulateStream("stderr"))

    Object.defineProperty(cp.stdout, "value", {
        get() {
            return stdout.value
        },
    })
    Object.defineProperty(cp.stderr, "value", {
        get() {
            return stderr.value
        },
    })

    if (process.platform === "win32") {
        cp.kill = () => {
            const p = new Promise(resolve => {
                cp.on("exit", resolve)
            })

            // Send Ctrl+C
            cp.send("\u0003")

            return p
        }
    }

    cp.waitFor = (text) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("TIMEOUT"))
        }, 5000)
        cp.stdout.on("data", function listener(chunk) {
            if (chunk.indexOf(text) !== -1) {
                cp.stdout.removeListener("data", listener)
                clearTimeout(timer)
                resolve()
            }
        })
        cp.on("exit", (exitCode) => {
            clearTimeout(timer)
            reject(new Error(`Exited with ${exitCode}: ${stderr.value}`))
        })
    })

    return new Promise((resolve, reject) => {
        cp.stdout.on("data", function listener(chunk) {
            if (chunk.indexOf("Start watching for") !== -1) {
                cp.stdout.removeListener("data", listener)
                resolve(cp)
            }
        })
        cp.on("error", reject)
        cp.on("exit", (exitCode) => {
            if (exitCode) {
                reject(new Error(`Exited with ${exitCode}: ${stderr.value}`))
            }
            resolve(cp)
        })
    })
}

/**
 * Setup files.
 * @param {object} files The file contents. This keys are file names, Their values are each content.
 * @returns {void}
 */
module.exports.setupFiles = (files) => {
    for (const name of Object.keys(files)) {
        const dirName = path.dirname(name)
        if (dirName) {
            fs.ensureDirSync(dirName)
        }
        fs.writeFileSync(path.join(WORKSPACE, name), files[name])
    }
}

/**
 * Write data into a file.
 * @param {string} file The path to a file to write.
 * @param {string} content The content of the file.
 * @returns {void}
 */
module.exports.write = (file, content) => {
    const dirName = path.dirname(file)
    if (dirName) {
        fs.ensureDirSync(dirName)
    }
    fs.writeFileSync(path.join(WORKSPACE, file), content)
}

/**
 * Remove a file.
 * @param {string} file The path to a file to remove.
 * @returns {void}
 */
module.exports.remove = (file) => {
    fs.remove(path.join(WORKSPACE, file))
}

/**
 * Create a directory.
 * @param {string} file The path to a file to write.
 * @returns {void}
 */
module.exports.mkdir = (file) => {
    fs.ensureDirSync(path.join(WORKSPACE, file))
}

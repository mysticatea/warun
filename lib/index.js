/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

const EventEmitter = require("events")
const fs = require("fs")
const path = require("path")
const chokidar = require("chokidar")
const spawn = require("cross-spawn")
const debounce = require("debounce")

/**
 * Check whether the given path is a directory or not.
 * @param {string} targetPath The path to check.
 * @returns {boolean} `true` if the path is a directory.
 * @private
 */
function isDirectory(targetPath) {
    try {
        return fs.statSync(targetPath).isDirectory()
    }
    catch (_err) {
        return false
    }
}

/**
 * The watcher.
 */
class Watcher extends EventEmitter {
    /**
     * Initialize this watcher.
     * @param {string|string[]} patterns The glob patterns to watch.
     * @param {string} command The command to run.
     * @param {string[]} args The arguments of the command.
     * @param {{initial:boolean,debounce:number}} [options] The options.
     * @param {boolean} [options.initial=true] The flag to run the command at ready.
     * @param {number} [options.debounce=250] The debounce wait time in milliseconds.
     */
    constructor(patterns, command, args, options) {
        super()

        this.patterns = Array.isArray(patterns) ? patterns.map(String) : [String(patterns)]
        this.command = String(command)
        this.args = Array.isArray(args) ? args.map(String) : []
        this.initial = (options && options.initial) !== false
        this.debounce = Number(options && options.debounce) || 250
        this.requestCommand = debounce(this.requestCommand, this.debounce)
        this._doneCommand = this._doneCommand.bind(this)
        this._watcher = null
        this._running = false
        this._dirty = false

        // Modify the path to a directory.
        this.patterns.forEach((pattern, index, array) => {
            if (isDirectory(pattern)) {
                array[index] = path.join(pattern, "**")
            }
        })
    }

    /**
     * Request to execute the command.
     * @returns {Watcher} this.
     */
    requestCommand() {
        if (this._running) {
            this._dirty = true
        }
        else {
            this._running = true

            spawn(this.command, this.args, {stdio: "inherit"})
                .on("exit", this._doneCommand)
                .on("error", this._doneCommand)
        }

        return this
    }

    /**
     * Finalize.
     * @param {any} x The exit code or error object.
     * @returns {void}
     * @private
     */
    _doneCommand(x) {
        this._running = false
        if (this._dirty) {
            this._dirty = false
            this.requestCommand()
        }
        if (x instanceof Error) {
            this.emit("error", x)
        }
    }

    /**
     * Start watching.
     * @returns {Watcher} this.
     */
    open() {
        this.close()
        this._watcher = chokidar.watch(this.patterns, {ignoreInitial: true})
            .on("all", (type, targetPath) => {
                this.emit("change", {type, path: targetPath})
                this.requestCommand()
            })
            .on("error", (error) => {
                this.emit("error", error)
            })
            .once("ready", () => {
                this.emit("ready")
                if (this.initial) {
                    this.requestCommand()
                }
            })

        return this
    }

    /**
     * End watching.
     * @returns {Watcher} this.
     */
    close() {
        if (this._watcher != null) {
            this._watcher.close()
            this._watcher = null
        }

        return this
    }
}

module.exports.Watcher = Watcher

/**
 * Watch.
 * @param {string|string[]} patterns The glob patterns to watch.
 * @param {string} command The command to run.
 * @param {string[]} args The arguments of the command.
 * @param {{initial:boolean,debounce:number}} [options] The options.
 * @param {boolean} [options.initial=true] The flag to run the command at ready.
 * @param {number} [options.debounce=250] The debounce wait time in milliseconds.
 * @returns {Watcher} The created watcher.
 */
module.exports.watch = (patterns, command, args, options) =>
    new Watcher(patterns, command, args, options).open()

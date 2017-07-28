#!/usr/bin/env node
/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

const minimist = require("minimist")
const printHelp = require("./help").printHelp

// Parse arguments.
const unknowns = []
const args = minimist(process.argv.slice(2), {
    "alias": {h: "help", v: "version"},
    "boolean": ["initial", "help", "version"],
    "default": {initial: true},
    "string": ["debounce"],
    "--": true,

    unknown(arg) {
        if (arg.startsWith("-")) {
            unknowns.push(arg)
        }
    },
})

if (args.help) {
    printHelp(process.stdout)
}
else if (args.version) {
    console.log(`v${require("../package.json").version}`)
}
else if (args._.length === 0) {
    console.error("It requires one or more glob patterns to watch files.")
    printHelp(process.stderr)
    process.exitCode = 1
}
else if (args["--"].length === 0) {
    console.error("It requires a command to run it.")
    printHelp(process.stderr)
    process.exitCode = 1
}
else if (unknowns.length >= 1) {
    console.error(`Unknown option(s): ${unknowns.join(", ")}`)
    printHelp(process.stderr)
    process.exitCode = 1
}
else {
    const events = require("./events")
    const watch = require("..").watch
    const watcher = watch(
        args._,
        args["--"][0],
        args["--"].slice(1),
        args
    )

    watcher
        .on("ready", () => {
            console.log(`Start watching for "${args["--"].join(" ")}"`)
        })
        .on("change", (e) => {
            console.log(`${e.type}: ${e.path}`)
        })
        .on("error", (err) => {
            console.error(`ERROR: ${err.message}`)
        })

    events.on("SIGINT", () => {
        console.log(`Stop watching for ${args["--"].join(" ")}`)
        watcher.close()
        process.exit(0) //eslint-disable-line no-process-exit
    })
}

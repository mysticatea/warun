/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

module.exports.printHelp = (output) => {
    output.write(`
Usage: wr <FILES> [OPTIONS] -- <COMMAND> [COMMAND_ARGS]

    Watch files and Run a command.

    FILES .......... One or more glob patterns to watch files.
    OPTIONS ........ Options below.
    COMMAND ........ The command name to run.
    COMMAND_ARGS ... The arguments of the command.

Options:
    --no-initial .......... The flag to prevent the first run at ready.
    --debounce <number> ... The debounce wait time in milliseconds.

Examples:
    $ wr lib test -- npm test
    $ wr src --no-initial -- npm run build

`)
}

# warun

[![npm version](https://img.shields.io/npm/v/warun.svg)](https://www.npmjs.com/package/warun)
[![Downloads/month](https://img.shields.io/npm/dm/warun.svg)](http://www.npmtrends.com/warun)
[![Build Status](https://travis-ci.org/mysticatea/warun.svg?branch=master)](https://travis-ci.org/mysticatea/warun)
[![Build Status](https://ci.appveyor.com/api/projects/status/1xgm9jjd7j9dj1x5/branch/master?svg=true)](https://ci.appveyor.com/project/mysticatea/warun/branch/master)
[![codecov](https://codecov.io/gh/mysticatea/warun/branch/master/graph/badge.svg)](https://codecov.io/gh/mysticatea/warun)
[![Dependency Status](https://david-dm.org/mysticatea/warun.svg)](https://david-dm.org/mysticatea/warun)

**Wa**tch files and **run** a command when they change.

## ⤴️ Motivation

This is CLI tool similar to [chokidar-cli](https://github.com/kimmobrunfeldt/chokidar-cli).
However, this does not run the command immediately if changes happen while the command is running. In that case, this waits for the finish of the previous command then this runs the command.
This will be useful if the command needs a long time.

## 💿 Installation

Use [npm](https://www.npmjs.com/) to install.

```console
$ npm install -D warun
```

### Requirements

- Node.js 4 or later.

## 📖 Usage

### CLI command

```
Usage: warun <FILES> [OPTIONS] -- <COMMAND> [COMMAND_ARGS]

    Watch files and Run a command.

    FILES .......... One or more glob patterns to watch files.
    OPTIONS ........ Options below.
    COMMAND ........ The command name to run.
    COMMAND_ARGS ... The arguments of the command.

Options:
    --no-initial .......... The flag to prevent the first run at ready.
    --debounce <number> ... The debounce wait time in milliseconds.

Examples:
    $ warun lib test -- npm test
    $ warun src --no-initial -- npm run build
```

### Node.js API

```js
const warun = require("warun")

// Start watching
const watcher = warun.watch(["src"], "npm", ["run", "build"])

// Stop watching
watcher.close()
```

#### watcher = new warun.Watcher(patterns, command, args, options)

The watcher class.<br>
This class inherits [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter).

##### Parameters

- `patterns` (`string | string[]`) ... The glob patterns of target files.
- `command` (`string`) ... The command to run.
- `args` (`string[]`) ... The arguments of the command.
- `options` (`object`) ... The options.
    - `options.initial` (`boolean`) ... The flag to run the command at ready. Default is `true`.
    - `options.debounce` (`number`) ... The debounce wait time in milliseconds. Default is `250`.

#### watcher.requestCommand()

Request to run the command.
Calls of this method are debounced.

#### watcher.open()

Start to watch files.

#### watcher.close()

Stop watching.

#### watcher.on("ready", () => {})

The ready event.
It emits this event once after the watching of all target files started.

#### watcher.on("change", (event) => {})

The change event of files.
It emits this event on every change of files.

- `event.type` is the type of the change.
- `event.path` is the path to the changed file.

#### watcher.on("error", (error) => {})

The error event of files.
It emits this event on every error of the watcher.

## 📰 Changelog

- [GitHub Releases](https://github.com/mysticatea/warun/releases)

## 🍻 Contributing

Contributing is welcome ❤

Please use GitHub's Issues/PRs.

### Development Tools

- `npm test` runs tests and measures coverage.
- `npm run coverage` shows the coverage result of `npm test` command.
- `npm run lint` runs ESLint.
- `npm run watch` runs `warun` to run tests on every file change.

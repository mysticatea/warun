/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

const assert = require("assert")
const fs = require("fs-extra")
const utils = require("./lib/utils")
const execWR = utils.execWR
const PRINT_LATER = utils.PRINT_LATER
const WORKSPACE = utils.WORKSPACE

describe("wr", () => {
    describe("--help", () => {
        it("should show help text.", async () => {
            const cp = await execWR("--help")
            assert(/Usage: /.test(cp.stdout.value))
        })
    })

    describe("-h", () => {
        it("should show help text.", async () => {
            const cp = await execWR("-h")
            assert(/Usage: /.test(cp.stdout.value))
        })
    })

    describe("--version", () => {
        it("should show version text.", async () => {
            const cp = await execWR("--version")
            assert(/^v\d+\.\d+\.\d+\n$/.test(cp.stdout.value))
        })
    })

    describe("-v", () => {
        it("should show version text.", async () => {
            const cp = await execWR("-v")
            assert(/^v\d+\.\d+\.\d+\n$/.test(cp.stdout.value))
        })
    })

    describe("when glob patterns don't exist,", () => {
        it("should show error.", async () => {
            try {
                await execWR("--", "test")
            }
            catch (err) {
                assert(/It requires one or more glob patterns to watch files/.test(err.message))
                return
            }
            assert(false, "should fail")
        })
    })

    describe("when the command does not exist,", () => {
        it("should show error.", async () => {
            try {
                await execWR("src")
            }
            catch (err) {
                assert(/It requires a command to run it/.test(err.message))
                return
            }
            assert(false, "should fail")
        })

        it("should show error.", async () => {
            try {
                await execWR("src", "--")
            }
            catch (err) {
                assert(/It requires a command to run it/.test(err.message))
                return
            }
            assert(false, "should fail")
        })
    })

    describe("when unknown arguments are given,", () => {
        it("should show error.", async () => {
            try {
                await execWR("src", "--foo", "--bar", "--", "test")
            }
            catch (err) {
                assert(/--foo, --bar/.test(err.message))
                return
            }
            assert(false, "should fail")
        })
    })

    describe("when valid arguments are given,", () => {
        const originalDir = process.cwd()
        let cp = null

        beforeEach(() => {
            fs.removeSync(WORKSPACE)
            fs.ensureDirSync(WORKSPACE)
            process.chdir(WORKSPACE)
        })
        afterEach(async () => {
            process.chdir(originalDir)

            if (cp != null) {
                await cp.kill("SIGINT")
                cp = null
            }

            fs.removeSync(WORKSPACE)
        })

        it("should run the command on ready.", async () => {
            cp = await execWR("*.txt", "--", "node", PRINT_LATER)
            await cp.waitFor("test")
        })

        it("should not run the command on ready if --no-initial was given.", async () => {
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            try {
                await cp.waitFor("test")
            }
            catch (_err) {
                return
            }
            assert(false, "should fail.")
        })

        it("should run the command on file is added.", async () => {
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.write("hello.txt", "Hello World!")
            await cp.waitFor("test")
            utils.write("hello2.txt", "Hello World!")
            await cp.waitFor("test")
            utils.write("hello3.txt", "Hello World!")
            await cp.waitFor("test")
        })

        it("should run the command on files are added. It's once.", async () => {
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.write("hello.txt", "Hello World!")
            utils.write("hello1.txt", "Hello World!")
            utils.write("hello2.txt", "Hello World!")
            await cp.waitFor("test")
            try {
                await cp.waitFor("test")
            }
            catch (_err) {
                return
            }
            assert(false, "should fail.")
        })

        it("should not run the command on files are added if it isn't matched with the pattern.", async () => {
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.write("hello.js", "console.log('Hello')")
            try {
                await cp.waitFor("test")
            }
            catch (_err) {
                return
            }
            assert(false, "should fail.")
        })

        it("should detect events in new directory.", async () => {
            cp = await execWR("**/*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.mkdir("aaa")
            utils.write("aaa/hello.txt", "Hello World!")
            await cp.waitFor("test")
        })

        it("should not run the command on files are added if it isn't matched with the pattern. (2)", async () => {
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.mkdir("aaa")
            utils.write("aaa/hello.txt", "Hello World!")
            try {
                await cp.waitFor("test")
            }
            catch (_err) {
                return
            }
            assert(false, "should fail.")
        })

        it("should run the command on file is changed.", async () => {
            utils.setupFiles({
                "hello.txt": "Hello",
            })
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.write("hello.txt", "Hey!")
            await cp.waitFor("test")
        })

        it("should not run the command on file is changed if it isn't matched with the pattern.", async () => {
            utils.setupFiles({
                "hello.txt": "Hello",
                "hello.js": "console.log('hello')",
            })
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.write("hello.js", "Hey!")
            try {
                await cp.waitFor("test")
            }
            catch (_err) {
                return
            }
            assert(false, "should fail.")
        })

        it("should run the command on file is removed.", async () => {
            utils.setupFiles({
                "hello.txt": "Hello",
            })
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.remove("hello.txt")
            await cp.waitFor("test")
        })

        it("should not run the command on file is removed if it isn't matched with the pattern.", async () => {
            utils.setupFiles({
                "hello.txt": "Hello",
                "hello.js": "console.log('hello')",
            })
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.remove("hello.js")
            try {
                await cp.waitFor("test")
            }
            catch (_err) {
                return
            }
            assert(false, "should fail.")
        })

        it("should not run the command on file is added and immediately removed.", async () => {
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER)
            utils.write("hello.txt", "Hey!")
            utils.remove("hello.txt")
            try {
                await cp.waitFor("test")
            }
            catch (_err) {
                return
            }
            assert(false, "should fail.")
        })

        it("should wait for the previous command has done.", async () => {
            cp = await execWR("*.txt", "--no-initial", "--", "node", PRINT_LATER, "2000")
            utils.write("hello.txt", "Hey!")
            await cp.waitFor(">>")
            utils.write("hello.txt", "こんにちは!")
            await cp.waitFor("test")
            await cp.waitFor(">>")
            await cp.waitFor("test")
        })

        it("should watch inside of the directory if a pattern is directory.", async () => {
            utils.setupFiles({
                "aaa/hello.txt": "Hello",
                "aaa/bbb/hello.txt": "Hello",
            })
            cp = await execWR("aaa", "--no-initial", "--", "node", PRINT_LATER)
            utils.write("aaa/bbb/hello.txt", "Hey!")
            await cp.waitFor("test")
        })
    })
})

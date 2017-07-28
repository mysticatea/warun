/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

const timeout = Number(process.argv[2]) || 0
const text = process.argv[3] || "test"

console.log(">>")
setTimeout(() => {
    console.log(text)
}, timeout)

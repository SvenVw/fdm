import type { BrowserContext } from "@playwright/test"
import fs from "node:fs/promises"
import url from "node:url"

export const testTmpDir = "../test-tmp/"
export const sessionFileName = "session.json"
export const magicLinkUrlFileName = "magicLink.txt"

interface TestIOCommonOptions {
    tmpUrl?: URL
}

function testFileUrl(fileName: string, options: TestIOCommonOptions) {
    return new URL(
        fileName,
        options.tmpUrl ?? new URL(testTmpDir, import.meta.url),
    )
}

export function runtimeTestTmpUrl(cwd = process.cwd()) {
    return new URL(
        "./test-tmp/",
        url.pathToFileURL(
            cwd.endsWith("/") || cwd.endsWith("\\") ? cwd : `${cwd}/`,
        ),
    )
}

async function ensureSessionDir(options: TestIOCommonOptions) {
    let exists = false
    const url = options.tmpUrl ?? new URL(testTmpDir, import.meta.url)
    try {
        exists = (await fs.stat(url)).isDirectory()
    } catch (_) {}

    if (!exists) {
        await fs.mkdir(url, { recursive: true })
    }
}

async function checkTestFileExists(
    fileName: string,
    options: TestIOCommonOptions,
) {
    let exists = false
    try {
        exists = (await fs.stat(testFileUrl(fileName, options))).isFile()
    } catch (_) {}

    return exists
}

export function readTestFile(
    fileName: string,
    options: TestIOCommonOptions = {},
) {
    if (!checkTestFileExists(fileName, options))
        throw new Error(`Test file ${fileName} does not exist.`)

    return fs.readFile(testFileUrl(fileName, options), { encoding: "utf-8" })
}

export async function writeTestFile(
    fileName: string,
    contents: string,
    flag = "w",
    options: TestIOCommonOptions = {},
) {
    await ensureSessionDir(options)
    return fs.writeFile(testFileUrl(fileName, options), contents, {
        encoding: "utf-8",
        flag,
    })
}

export async function loadSessionFromFile(context: BrowserContext) {
    const cookies = JSON.parse(await readTestFile(sessionFileName))

    context.addCookies(cookies)
}

export async function saveSessionToFile(context: BrowserContext) {
    return writeTestFile(
        sessionFileName,
        JSON.stringify(await context.cookies()),
    )
}

export async function writeTestFileLine(
    fileName: string,
    line: string,
    options: TestIOCommonOptions = {},
) {
    return writeTestFile(fileName, `${line}\n`, "w+", options)
}

export async function testFileLine(
    fileName: string,
    options: TestIOCommonOptions = {},
) {
    const readStream = await fs.open(testFileUrl(fileName, options))
    let myLine = ""
    for await (const line of readStream.readLines()) {
        myLine = line
        break
    }
    readStream.close()
    return myLine
}

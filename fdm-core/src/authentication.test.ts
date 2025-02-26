import { beforeEach, describe, expect, inject, it } from "vitest"
import { type BetterAuth, createFdmAuth } from "./authentication"
import { createFdmServer } from "./fdm-server"
import type { FdmType } from "./fdm"

describe("createFdmAuth", () => {
    let fdm: FdmType
    let fdmAuth: BetterAuth

    beforeEach(() => {
        // Mock environment variables
        process.env.GOOGLE_CLIENT_ID = "mock_google_client_id"
        process.env.GOOGLE_CLIENT_SECRET = "mock_google_client_secret"
        process.env.MS_CLIENT_ID = "mock_ms_client_id"
        process.env.MS_CLIENT_SECRET = "mock_ms_client_secret"

        // Create a mock FdmServer instance
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)
    })

    it("should create an auth instance with the correct database adapter", () => {
        // Create the auth server using the mock FdmServer instance
        fdmAuth = createFdmAuth(fdm)
        expect(fdmAuth).toBeDefined()
    })
})

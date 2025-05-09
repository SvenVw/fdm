import { beforeEach, describe, expect, inject, it } from "vitest"
import {
    type BetterAuth,
    createDisplayUsername,
    createFdmAuth,
    splitFullName,
} from "./authentication"
import type { FdmType } from "./fdm"
import { createFdmServer } from "./fdm-server"

describe("createFdmAuth", () => {
    let fdm: FdmType
    let fdmAuth: BetterAuth
    let googleAuth: { clientSecret: string; clientId: string }
    let microsoftAuth: { clientSecret: string; clientId: string }

    beforeEach(() => {
        // Mock environment variables
        googleAuth = {
            clientId: "mock_google_client_id",
            clientSecret: "mock_google_client_secret",
        }
        microsoftAuth = {
            clientId: "mock_ms_client_id",
            clientSecret: "mock_ms_client_secret",
        }

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
        fdmAuth = createFdmAuth(fdm, googleAuth, microsoftAuth)
        expect(fdmAuth).toBeDefined()

        // Verify auth providers are correctly configured
        expect(fdmAuth.options.socialProviders?.google).toBeDefined()
        expect(fdmAuth.options.socialProviders?.microsoft).toBeDefined()

        // Verify database adapter is properly connected
        expect(fdmAuth.options.database).toBeDefined()
    })
})
describe("splitFullName", () => {
    let splittedFullName: { firstname: string | null; surname: string | null }

    it("should split a full name with first and last name", () => {
        splittedFullName = splitFullName("John Doe")
        expect(splittedFullName.firstname).toBe("John")
        expect(splittedFullName.surname).toBe("Doe")
    })

    it("should handle a single name", () => {
        splittedFullName = splitFullName("Jane ")
        expect(splittedFullName.firstname).toBe("Jane")
        expect(splittedFullName.surname).toBeNull()
    })

    it("should handle a name with middle name", () => {
        splittedFullName = splitFullName("John Middle Doe")
        expect(splittedFullName.firstname).toBe("John")
        expect(splittedFullName.surname).toBe("Doe")
    })

    it("should handle 'LastName, FirstName' format", () => {
        splittedFullName = splitFullName("Doe, John")
        expect(splittedFullName.firstname).toBe("John")
        expect(splittedFullName.surname).toBe("Doe")
    })

    it("should handle empty name", () => {
        splittedFullName = splitFullName("")
        expect(splittedFullName.firstname).toBeNull()
        expect(splittedFullName.surname).toBeNull()
    })

    it("should handle undefined name", () => {
        splittedFullName = splitFullName(undefined)
        expect(splittedFullName.firstname).toBeNull()
        expect(splittedFullName.surname).toBeNull()
    })

    it("should handle name with extra spaces", () => {
        splittedFullName = splitFullName("  John   Doe  ")
        expect(splittedFullName.firstname).toBe("John")
        expect(splittedFullName.surname).toBe("Doe")
    })

    it("should handle name with comma and extra spaces", () => {
        splittedFullName = splitFullName("  Doe  ,   John  ")
        expect(splittedFullName.firstname).toBe("John")
        expect(splittedFullName.surname).toBe("Doe")
    })
})

describe("createDisplayUsername", () => {
    it("should return full name when both first and last names are provided", () => {
        const firstname = "John"
        const surname = "Doe"
        const displayName = createDisplayUsername(firstname, surname)
        expect(displayName).toBe("John Doe")
    })

    it("should return only first name when only first name is provided", () => {
        const firstname = "John"
        const surname = null
        const displayName = createDisplayUsername(firstname, surname)
        expect(displayName).toBe("John")
    })

    it("should return only last name when only last name is provided", () => {
        const firstname = null
        const surname = "Doe"
        const displayName = createDisplayUsername(firstname, surname)
        expect(displayName).toBe("Doe")
    })

    it("should return null when neither first nor last name is provided", () => {
        const firstname = null
        const surname = null
        const displayName = createDisplayUsername(firstname, surname)
        expect(displayName).toBeNull()
    })
})

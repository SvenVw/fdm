import { createFdmAuth } from "../../authentication";
import { createFdmServer } from "../../fdm-server";

const host = String(process.env.POSTGRES_HOST)
const port = Number(process.env.POSTGRES_PORT)
if (Number.isNaN(port)) {
    throw new Error("POSTGRES_PORT must be a valid number")
}
const user = String(process.env.POSTGRES_USER)
const password = String(process.env.POSTGRES_PASSWORD)
const database = String(process.env.POSTGRES_DB)

// Mock environment variables
const googleAuth = {
    clientId: "mock_google_client_id",
    clientSecret: "mock_google_client_secret",
}
const microsoftAuth = {
    clientId: "mock_ms_client_id",
    clientSecret: "mock_ms_client_secret",
}

const fdm = createFdmServer(host, port, user, password, database)
export const auth = createFdmAuth(fdm, googleAuth, microsoftAuth)
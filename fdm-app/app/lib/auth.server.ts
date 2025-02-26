import { createFdmAuth } from "@svenvw/fdm-core"
import { fdm } from "@/lib/fdm.server"

// Initialize better-auth instance for FDM
export const auth = createFdmAuth(fdm)
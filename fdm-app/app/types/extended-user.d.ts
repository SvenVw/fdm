import type { FdmAuth } from "@svenvw/fdm-core"

export type ExtendedUser = FdmAuth["$Infer"]["Session"]["user"]

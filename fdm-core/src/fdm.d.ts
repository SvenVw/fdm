import type { FdmLocalTransactionType, FdmLocalType } from "./fdm-local"
import type { FdmServerTransactionType, FdmServerType } from "./fdm-server"

// Define type of Fdm
export type FdmType =
    | FdmServerType
    | FdmLocalType
    | FdmServerTransactionType
    | FdmLocalTransactionType

---
"@svenvw/fdm-core": minor
---

Adds functions to manage user and organization access to farms.

**New Functions:**

*   `grantRoleToFarm`: Grants a role to a principal (user/org) on a farm.
*   `isAllowedToShareFarm`: Checks if a principal can share a farm.
*   `listPrincipalsForFarm`: Lists principals with access to a farm.
*   `revokePrincipalFromFarm`: Removes access for a principal.
*   `updateRoleOfPrincipalAtFarm`: Updates a principal's role.

**Purpose:** Enables granular control over farm data access between users and organizations.
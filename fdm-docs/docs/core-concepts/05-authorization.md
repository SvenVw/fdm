---
title: "Authorization"
sidebar_position: 5
---

# Authorization in FDM Core

The `@svenvw/fdm-core` package includes a built-in authorization system to control access to resources based on user roles. This system operates primarily using the `fdm-authz` database schema and associated functions within the library.

## Core Concepts

The authorization model is based on Role-Based Access Control (RBAC) and uses the following concepts:

*   **Principal (`PrincipalId`):** Represents the user attempting an action. This is typically the user ID obtained from the authentication system (`fdm-authn` schema, `user` table).
*   **Resource (`Resource`):** The type of entity being accessed. Defined resources include:
    *   `farm`
    *   `field`
    *   `cultivation`
    *   `harvesting`
    *   `fertilizer_application`
    *   `soil_analysis`
    *   `user` (for managing user details/settings)
    *   `organization` (if multi-tenancy/organizations are used)
*   **Resource ID (`ResourceId`):** The specific unique identifier of the resource instance (e.g., a specific `b_id_farm`, `b_id`, `p_app_id`).
*   **Role (`Role`):** The role assigned to a principal for a specific resource. Defined roles include:
    *   `owner`: Typically full control over the resource and its children.
    *   `advisor`: Often read/write access for management purposes.
    *   `researcher`: Usually limited to read access for analysis.
*   **Action (`Action`):** The operation the principal wants to perform. Defined actions include:
    *   `read`: View resource details.
    *   `write`: Create or modify the resource or related actions.
    *   `list`: View a list of resources (often checked at a higher level, e.g., listing fields within a farm).
    *   `share`: Grant or revoke roles for the resource.
*   **Permissions:** A predefined mapping (within `authorization.ts`) defines which `Role` can perform which `Action` on each `Resource` type. For example, an `owner` of a `farm` can `read`, `write`, `list`, and `share` that farm and its related child resources (fields, cultivations etc.), while a `researcher` might only have `read` access.

## How it Works

1.  **Granting Access:** Access is granted by assigning a `Role` to a `PrincipalId` for a specific `ResourceId`. This is done using the `grantRole` function, which creates a record in the `fdm-authz.role` table.
    ```typescript
    import { grantRole, FdmServerType, PrincipalId } from '@svenvw/fdm-core';

    // Assume fdm, principalId, targetUserId, farmId are defined
    // Grant the 'advisor' role for a specific farm to another user
    // await grantRole(fdm, 'farm', 'advisor', farmId, targetUserId); 
    ```
2.  **Revoking Access:** Access is revoked using the `revokeRole` function, which marks the corresponding record in the `fdm-authz.role` table as deleted (soft delete).
    ```typescript
    import { revokeRole, FdmServerType, PrincipalId } from '@svenvw/fdm-core';

    // Assume fdm, principalId, targetUserId, farmId are defined
    // Revoke the 'advisor' role for a specific farm from a user
    // await revokeRole(fdm, 'farm', 'advisor', farmId, targetUserId);
    ```
3.  **Checking Permissions:** When you call most data manipulation or retrieval functions in `fdm-core` (e.g., `addField`, `getField`, `addCultivation`), they internally call the `checkPermission` function.
    *   `checkPermission` takes the `principalId`, the target `resource`, the intended `action`, and the `resource_id`.
    *   It determines the required roles for the action based on the predefined `permissions`.
    *   **Resource Chain Lookup:** It then uses an internal helper (`getResourceChain`) to identify the hierarchical relationship of the target resource. FDM resources often have a parent-child relationship. For example:
        *   A `fertilizer_application` happens on a `field`.
        *   A `field` belongs to a `farm`.
        *   A `cultivation` happens on a `field`, which belongs to a `farm`.
        *   A `harvesting` event relates to a `cultivation`, which happens on a `field`, which belongs to a `farm`.
        The `getResourceChain` function queries the database to find these links and returns an ordered list representing this hierarchy, like `[{ resource: 'farm', resource_id: 'farm123' }, { resource: 'field', resource_id: 'fieldABC' }, { resource: 'fertilizer_application', resource_id: 'fertAppXYZ' }]`.
    *   **Permission Check Along the Chain:** `checkPermission` iterates through this chain, starting from the most specific resource (e.g., `fertilizer_application`) up to the highest level (e.g., `farm`). At each level, it checks if the `principalId` has one of the required roles assigned *specifically for that resource bead* (e.g., checking roles for `fertAppXYZ`, then roles for `fieldABC`, then roles for `farm123`) in the `fdm-authz.role` table.
    *   **Cascading Permissions:** If permission is granted at *any* level in the chain (e.g., the user is `owner` of the `farm`), the check succeeds, and the original function proceeds. This effectively means permissions granted at higher levels (like the farm) cascade down to child resources (like fields, cultivations, applications within that farm).
    *   If no required role is found for the principal at any level of the chain, `checkPermission` throws a "Permission denied" error, halting the original function call.
4.  **Listing Accessible Resources:** The `listResources` function can be used to find all resources of a specific type (e.g., `farm`) that a user has permission to perform a certain action on (e.g., `read`).
    ```typescript
    import { listResources, FdmServerType, PrincipalId } from '@svenvw/fdm-core';

    // Assume fdm, principalId are defined
    // Get all farm IDs the user can read
    // const readableFarmIds = await listResources(fdm, 'farm', 'read', principalId);
    // console.log(readableFarmIds); 
    ```
5.  **Auditing:** Every call to `checkPermission` (whether successful or failed) is logged as an entry in the `fdm-authz.audit` table. This provides a trail of who attempted what action on which resource, when, from where (`origin`), whether it was allowed, and which role assignment granted the access if successful.

## Key Considerations

*   **Principal ID:** All core functions that involve data access require the `principalId` to perform permission checks.
*   **Role Management:** Granting and revoking roles is typically an administrative task, often performed via dedicated UI elements or scripts that call `grantRole` and `revokeRole`.
*   **Resource Chain:** Understanding the resource hierarchy (`getResourceChain`) is crucial for predicting how permissions propagate (e.g., farm owner permissions cascade down).
*   **Predefined Permissions:** The mapping between roles, resources, and actions is currently hardcoded in the `permissions` array within `authorization.ts`. Modifying these permissions requires changing the library code.

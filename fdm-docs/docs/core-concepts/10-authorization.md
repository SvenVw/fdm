---
title: Authorization
---

# Authorization

Authorization is the process of determining what actions a user is allowed to perform. The Farm Data Model (FDM) provides a resource-based permission model that allows you to control access to your data.

## The Permission Model

FDM's permission model is based on a combination of **resources**, **roles**, and **actions**.

*   **Resources:** These are the main entities in the FDM, such as `farm`, `field`, `cultivation`, etc.
*   **Roles:** These are collections of permissions that can be assigned to a user for a specific resource. FDM defines the following roles:
    *   `owner`: Full control over the resource.
    *   `advisor`: Can view and edit the resource.
    *   `researcher`: Can only view the resource.
*   **Actions:** These are the operations that can be performed on a resource, such as `read`, `write`, `list`, and `share`.

## How Access Control is Handled

Access control is handled by the `fdm-authz` schema, which contains two main tables:

*   **`role`**: This table stores the roles that have been assigned to users for specific resources. Each row in this table represents a single role assignment, linking a `principal_id` (user) to a `resource` and `resource_id`.
*   **`audit`**: This table provides an audit trail of all authorization checks. It records who attempted to perform what action on which resource, and whether the action was allowed or denied.

When a user attempts to perform an action, the `checkPermission` function is called. This function does the following:

1.  **Determines the required roles:** It first determines which roles are required to perform the requested action on the given resource.
2.  **Constructs the resource hierarchy:** It then constructs the resource hierarchy for the target resource. For example, if the target resource is a `cultivation`, the hierarchy would be `farm` -> `field` -> `cultivation`.
3.  **Checks for permissions:** It then checks to see if the user has been granted any of the required roles on any of the resources in the hierarchy.
4.  **Audits the check:** Finally, it records the result of the check in the `audit` table.

This system provides a flexible and secure way to control access to your data, while also providing a complete audit trail of all access control decisions.

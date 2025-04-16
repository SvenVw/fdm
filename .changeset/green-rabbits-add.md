---
"@svenvw/fdm-core": minor
---

This change introduces a suite of helper functions within `fdm-core` to facilitate comprehensive organization management and user interaction. These functions enable users and administrators to manage organizations, invite members, and control access.

**Organization Management:**

*   `createOrganization`: Creates a new organization.
*   `checkOrganizationSlugForAvailability`: Checks if a given organization slug is available for use.
*   `getOrganizationsForUser`: Retrieves a list of organizations a user belongs to.
*   `deleteOrganization`: Deletes an organization.

**User Management:**

*   `getUsersInOrganization`: Retrieves a list of users within a specific organization.
*   `removeUserFromOrganization`: Removes a user from an organization.
*   `updateRoleOfUserAtOrganization`: Updates the role of a user within an organization.

**Invitation Management:**

*   `inviteUserToOrganization`: Sends an invitation to a user to join an organization.
*   `getPendingInvitationsForUser`: Retrieves a list of pending invitations for a user.
*   `getPendingInvitation`: Retrieves a specific pending invitation.
*   `acceptInvitation`: Accepts a pending invitation to join an organization.
*   `rejectInvitation`: Rejects a pending invitation to join an organization.

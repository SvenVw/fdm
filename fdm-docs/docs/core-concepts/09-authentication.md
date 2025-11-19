---
title: Authentication
---

# Authentication

Authentication is the process of verifying the identity of a user. The Farm Data Model (FDM) utilizes the [Better Auth](https://better-auth.com/) library to provide a standard authentication system. This implementation supports multiple authentication strategies and handles session management through a database-backed approach.

## Supported Strategies

FDM is configured to support several authentication methods. The availability of these methods can depend on the specific configuration of the FDM instance.

### Magic Links
FDM supports passwordless authentication via Magic Links.
*   Users provide their email address.
*   The system sends a secure, time-limited link to that email.
*   Clicking the link authenticates the user without requiring a password.

### OAuth Providers
FDM includes integration with **Google** and **Microsoft** OAuth providers.
*   **Account Linking:** Users can log in using their existing Google or Microsoft accounts.
*   **Profile Mapping:** Upon login, FDM maps profile information from the provider (First Name, Last Name, and Profile Picture) to the FDM user profile.
*   **User Creation:** New users authenticating via OAuth are automatically provisioned with a unique username and default settings (e.g., language preference set to `nl-NL`).

## Session Management

FDM uses a database-backed session system managed by Better Auth.

*   **Session Storage:** Sessions are stored in the database using the Drizzle ORM adapter. This allows for server-side session control and revocation.
*   **Expiration:** By default, sessions are configured to expire after 30 days.
*   **Renewal:** Active sessions are automatically updated every 24 hours to extend their validity.

## Implementation Details

The core authentication logic resides in `fdm-core/src/authentication.ts`.

*   **Schema Extensions:** The user schema is extended to include FDM-specific fields such as `firstname`, `surname`, `lang`, and `farm_active`.
*   **Organizations:** The system utilizes the Better Auth organization plugin, which supports the creation and management of organizations within the authentication flow.

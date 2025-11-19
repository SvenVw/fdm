---
title: Authentication
---

# Authentication

Authentication is the process of verifying the identity of a user. The Farm Data Model (FDM) provides a standard authentication system that supports a variety of authentication strategies.

## How Users are Verified

FDM uses a combination of JSON Web Tokens (JWTs) and sessions to authenticate users.

> **What is a JWT?**
>
> A JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties. The claims in a JWT are encoded as a JSON object that is used as the payload of a JSON Web Signature (JWS) structure or as the plaintext of a JSON Web Encryption (JWE) structure, enabling the claims to be digitally signed or integrity protected with a Message Authentication Code (MAC) and/or encrypted.

When a user logs in, they are issued a JWT that contains their user ID and other relevant information. This JWT is then sent with each subsequent request to the server, where it is used to verify the user's identity.

## Supported Strategies

FDM supports a variety of authentication strategies, including:

*   **Username and Password:** The traditional method of authentication, where users provide a username and password to log in.
*   **OAuth Providers:** FDM can be integrated with popular OAuth providers, such as Google and Microsoft, to allow users to log in with their existing accounts.

The authentication mechanisms are handled by the `fdm-core/src/authentication.ts` file, which is built on top of the `better-auth` library.

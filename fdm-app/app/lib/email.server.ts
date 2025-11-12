/**
 * @file This module handles all server-side email sending functionalities.
 *
 * It uses `@react-email/components` to render HTML for different types of emails
 * (e.g., Welcome, Magic Link, Invitation) and the `postmark` library to dispatch them.
 * The configuration for the email provider is sourced from the server-side config.
 *
 * @packageDocumentation
 */
import { TZDate } from "@date-fns/tz"
import { render } from "@react-email/components"
import type { User } from "better-auth"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import postmark from "postmark"
import { InvitationEmail } from "~/components/blocks/email/invitation"
import { MagicLinkEmail } from "~/components/blocks/email/magic-link"
import { WelcomeEmail } from "~/components/blocks/email/welcome"
import { serverConfig } from "~/lib/config.server"
import type { ExtendedUser } from "~/types/extended-user"

const client = new postmark.ServerClient(String(process.env.POSTMARK_API_KEY))

/** Represents the structure of an email to be sent via Postmark. */
interface Email {
    From: string
    To: string
    Subject: string
    HtmlBody: string
    Tag: string
}

/**
 * Renders the welcome email template.
 *
 * @param user - The user object for whom the email is being sent.
 * @returns An `Email` object ready to be sent.
 */
export async function renderWelcomeEmail(user: User): Promise<Email> {
    const emailHtml = await render(
        WelcomeEmail({
            name: user.name,
            url: serverConfig.url,
            appName: serverConfig.name,
            appBaseUrl: serverConfig.url,
        }),
    )

    return {
        From: `"${serverConfig.mail?.postmark.sender_name}" <${serverConfig.mail?.postmark.sender_address}>`,
        To: user.email,
        Subject: `Welkom bij ${serverConfig.name}! Krijg inzicht in je bedrijfsdata.`,
        HtmlBody: emailHtml,
        Tag: "welcome",
    }
}

/**
 * Renders the organization invitation email template.
 *
 * @param inviteeEmail - The email address of the person being invited.
 * @param inviter - The user who is sending the invitation.
 * @param organizationName - The name of the organization to which the user is invited.
 * @param invitationId - The unique ID of the invitation.
 * @returns An `Email` object ready to be sent.
 */
export async function renderInvitationEmail(
    inviteeEmail: string,
    inviter: ExtendedUser,
    organizationName: string,
    invitationId: string,
): Promise<Email> {
    const emailHtml = await render(
        InvitationEmail({
            inviteeEmail: inviteeEmail,
            inviterName: `${inviter.firstname} ${inviter.surname}`,
            invitationId: invitationId,
            organizationName: organizationName,
            appName: serverConfig.name,
            appBaseUrl: serverConfig.url,
        }),
        { pretty: true },
    )

    return {
        From: `"${serverConfig.mail?.postmark.sender_name}" <${serverConfig.mail?.postmark.sender_address}>`,
        To: inviteeEmail,
        Subject: `${inviter.firstname} ${inviter.surname} heeft je uitgenodigd om lid te worden van ${organizationName}!`,
        HtmlBody: emailHtml,
        Tag: "invitation-organization",
    }
}

/**
 * Renders the magic link sign-in email template.
 *
 * @param emailAddress - The recipient's email address.
 * @param magicLinkUrl - The unique magic link URL for signing in.
 * @returns An `Email` object ready to be sent.
 */
export async function renderMagicLinkEmail(
    emailAddress: string,
    magicLinkUrl: string,
): Promise<Email> {
    const timeZone = getTimeZoneFromUrl(magicLinkUrl)
    const emailTimestamp: string = format(
        timeZone ? TZDate.tz(timeZone) : new Date(),
        "Pp",
        { locale: nl },
    )

    const emailHtml = await render(
        MagicLinkEmail({
            url: magicLinkUrl,
            appName: serverConfig.name,
            appBaseUrl: serverConfig.url,
            senderName: serverConfig.mail?.postmark.sender_name,
            emailTimestamp: emailTimestamp,
        }),
        { pretty: true },
    )

    return {
        From: `"${serverConfig.mail?.postmark.sender_name}" <${serverConfig.mail?.postmark.sender_address}>`,
        To: emailAddress,
        Subject: `Aanmeldlink voor ${serverConfig.name} | ${emailTimestamp}`,
        HtmlBody: emailHtml,
        Tag: "magic-link",
    }
}

/**
 * Extracts and validates a timezone from a magic link's callback URL.
 * @internal
 */
function getTimeZoneFromUrl(url: string): string | undefined {
    try {
        const parsedMagicLinkUrl = new URL(url)
        const callbackUrlCandidate =
            parsedMagicLinkUrl.searchParams.get("callbackURL")
        if (!callbackUrlCandidate) return undefined

        const parsedCallbackUrl = new URL(
            callbackUrlCandidate,
            callbackUrlCandidate.startsWith("http")
                ? undefined
                : "http://example.com",
        )
        const timeZoneCandidate = parsedCallbackUrl.searchParams.get("timeZone")

        if (timeZoneCandidate) {
            Intl.DateTimeFormat(undefined, { timeZone: timeZoneCandidate })
            return timeZoneCandidate
        }
    } catch (error) {
        console.warn("Invalid timezone in callbackURL:", error)
    }
    return undefined
}

/**
 * Sends a pre-rendered email using the Postmark client.
 *
 * @param email - The `Email` object to be sent.
 */
export async function sendEmail(email: Email): Promise<void> {
    await client.sendEmail(email)
}

/**
 * A helper function passed to `fdm-core`'s authentication module to handle the
 * sending of magic link emails.
 *
 * @param emailAddress - The recipient's email address.
 * @param magicLinkUrl - The unique magic link URL for signing in.
 */
export async function sendMagicLinkEmailToUser(
    emailAddress: string,
    magicLinkUrl: string,
): Promise<void> {
    const email = await renderMagicLinkEmail(emailAddress, magicLinkUrl)
    await sendEmail(email)
}

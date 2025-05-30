import { render } from "@react-email/components"
import type { User } from "better-auth"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import postmark from "postmark"
import { InvitationEmail } from "~/components/custom/email/invitation"
import { MagicLinkEmail } from "~/components/custom/email/magic-link"
import { WelcomeEmail } from "~/components/custom/email/welcome"
import { serverConfig } from "~/lib/config.server"
import type { ExtendedUser } from "~/types/extended-user"

const client = new postmark.ServerClient(String(process.env.POSTMARK_API_KEY))

interface Email {
    From: string
    To: string
    Subject: string
    HtmlBody: string
    Tag: string
}

export async function renderWelcomeEmail(user: User): Promise<Email> {
    const emailHtml = await render(
        WelcomeEmail({
            name: user.name,
            url: serverConfig.url,
            appName: serverConfig.name,
            appBaseUrl: serverConfig.url,
        }),
    )

    const email = {
        From: `"${serverConfig.mail?.postmark.sender_name}" <${serverConfig.mail?.postmark.sender_address}>`,
        To: user.email,
        Subject: `Welkom bij ${serverConfig.name}! Krijg inzicht in je bedrijfsdata.`,
        HtmlBody: emailHtml,
        Tag: 'welcome',
    }

    return email
}

export async function renderInvitationEmail(
    inviteeEmail: string,
    inviter: ExtendedUser,
    organizationName: string,
): Promise<Email> {
    const emailHtml = await render(
        InvitationEmail({
            inviteeEmail: inviteeEmail,
            inviterName: `${inviter.firstname} ${inviter.surname}`,
            organizationName: organizationName,
            appName: serverConfig.name,
            appBaseUrl: serverConfig.url,
        }),
        { pretty: true },
    )

    const email: Email = {
        From: `"${serverConfig.mail?.postmark.sender_name}" <${serverConfig.mail?.postmark.sender_address}>`,
        To: inviteeEmail,
        Subject: `${inviter.firstname} ${inviter.surname} heeft je uitgenodigd om lid te worden van ${organizationName}!`,
        HtmlBody: emailHtml,
        Tag: 'invitation-organization',
    }

    return email
}

export async function renderMagicLinkEmail(
    emailAddress: string,
    magicLinkUrl: string,
): Promise<Email> {
    const emailHtml = await render(
        MagicLinkEmail({
            url: magicLinkUrl,
            appName: serverConfig.name,
            appBaseUrl: serverConfig.url,
            senderName: serverConfig.mail?.postmark.sender_name,
        }),
        { pretty: true },
    )

    const email: Email = {
        From: `"${serverConfig.mail?.postmark.sender_name}" <${serverConfig.mail?.postmark.sender_address}>`,
        To: emailAddress,
        Subject: `Beveiligde link om in te loggen bij ${serverConfig.name} | ${format(new Date(), 'Pp', { locale: nl })}`,
        HtmlBody: emailHtml,
        Tag: 'magic-link',
    }

    return email
}

export async function sendEmail(email: Email): Promise<void> {
    await client.sendEmail(email)
}

// Helper function to send magic link emails, to be passed to fdm-core
export async function sendMagicLinkEmailToUser(
    emailAddress: string,
    magicLinkUrl: string,
): Promise<void> {
    const email = await renderMagicLinkEmail(emailAddress, magicLinkUrl)
    await sendEmail(email)
}

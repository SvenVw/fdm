import { render } from "@react-email/components"
import type { User } from "better-auth"
import postmark from "postmark"
import { InvitationEmail } from "~/components/custom/email/invitation"
import { WelcomeEmail } from "~/components/custom/email/welcome"
import { serverConfig } from "~/lib/config.server"

const client = new postmark.ServerClient(String(process.env.POSTMARK_API_KEY))

interface Email {
    From: string
    To: string
    Subject: string
    HtmlBody: string
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
    }

    return email
}

export async function renderInvitationEmail(
    inviteeEmail: string,
    inviter: User,
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
    }

    return email
}

export async function sendEmail(email: Email): Promise<void> {
    await client.sendEmail(email)
}

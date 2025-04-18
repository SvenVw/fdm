import * as Sentry from "@sentry/react"
import { clientConfig } from "@/app/lib/config"
import { LifeBuoy, Send } from "lucide-react"
import { NavLink } from "react-router"
import { toast } from "sonner"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar"
import { useEffect, useState } from "react"

export function SidebarSupport({
    name,
    email,
}: { name: string | undefined; email: string | undefined }) {
    if (clientConfig.analytics.sentry) {
        try {
            Sentry.setUser({
                fullName: name,
                email: email,
            })
        } catch (error) {
            Sentry.captureException(error)
        }
    }

    const [feedback, setFeedback] = useState<ReturnType<
        typeof Sentry.getFeedback
    > | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        try {
            const feedbackInstance = Sentry.getFeedback()
            if (feedbackInstance) {
                setFeedback(feedbackInstance)
            } else {
                console.warn("Sentry.getFeedback() returned null or undefined.")
            }
        } catch (error) {
            console.error("Failed to initialize Sentry feedback:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    if (isLoading) {
        return null
    }

    const openFeedbackForm = async () => {
        if (!feedback || typeof feedback.createForm !== "function") {
            console.error(
                "Feedback object not available or missing createForm method.",
            )
            toast.error(
                "Feedback formulier is nog niet beschikbaar. Probeer het opnieuw.",
            )
            return
        }
        try {
            const form = await feedback.createForm()
            form.appendToDom()
            form.open()
        } catch (error) {
            Sentry.captureException(error)
            toast.error(
                "Er is een fout opgetreden bij het openen van het feedbackformulier. Probeer het later opnieuw.",
            )
        }
    }

    const handleSupportClick = () => {
        const supportEmail = `support@${window.location.hostname}`
        window.location.href = `mailto:${supportEmail}`
    }

    return (
        <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem key="support">
                        <SidebarMenuButton
                            size="sm"
                            onClick={handleSupportClick}
                        >
                            <LifeBuoy />
                            <span>Ondersteuning</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    {clientConfig.analytics.sentry ? (
                        <SidebarMenuItem key="feedback">
                            <SidebarMenuButton
                                asChild
                                size="sm"
                                onClick={openFeedbackForm}
                            >
                                <NavLink to="#">
                                    <Send />
                                    <span>Feedback</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ) : null}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

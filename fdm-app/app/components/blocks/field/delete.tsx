import { Form } from "react-router"
import { Spinner } from "~/components/ui/spinner"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"

interface FieldDeleteDialogProps {
    fieldName: string
    isSubmitting: boolean
}

export function FieldDeleteDialog({
    fieldName,
    isSubmitting,
}: FieldDeleteDialogProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isSubmitting}>
                    Perceel verwijderen
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Deze actie kan niet ongedaan worden gemaakt. Dit
                        verwijdert het perceel "{fieldName}" en alle
                        bijbehorende gegevens, inclusief gewassen, bemestingen,
                        bodemanalyses en oogsten.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>
                        Annuleren
                    </AlertDialogCancel>
                    <Form method="delete">
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center space-x-2">
                                    <Spinner />
                                    <span>Verwijderen</span>
                                </div>
                            ) : (
                                "Verwijderen"
                            )}
                        </Button>
                    </Form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

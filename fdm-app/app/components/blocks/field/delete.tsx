import { Form } from "react-router"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { LoadingSpinner } from "~/components/custom/loadingspinner"

interface FieldDeleteDialogProps {
    fieldName: string;
    isSubmitting: boolean;
}

export function FieldDeleteDialog({ fieldName, isSubmitting }: FieldDeleteDialogProps) {
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
                        Deze actie kan niet ongedaan worden gemaakt. Dit verwijdert het perceel
                        "{fieldName}" en alle bijbehorende gegevens, inclusief gewassen,
                        bemestingen, bodemanalyses en oogsten.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Annuleren</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Form method="delete">
                            <Button type="submit" variant="destructive" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <div className="flex items-center space-x-2">
                                        <LoadingSpinner />
                                        <span>Verwijderen</span>
                                    </div>
                                ) : (
                                    "Verwijderen"
                                )}
                            </Button>
                        </Form>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

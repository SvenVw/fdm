import { Card, CardContent, CardHeader } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"
import { Spinner } from "~/components/ui/spinner"

/** Placeholder for the field page while Dyna calculates. */
export function FieldMineralizationSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-5 w-56" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/40 flex h-80 flex-col items-center justify-center gap-2 rounded-lg">
            <Spinner className="size-5" />
            <p className="text-muted-foreground text-sm">
              Dyna rekent de stikstof door het seizoen door…
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  )
}

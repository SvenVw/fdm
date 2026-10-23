import { ArrowLeftRight, Check } from "lucide-react"
import type { ChangeSummaryAgainstRvo } from "./review-fields"

export function UserChoicesSummary({
  changeSummaryAgainstRvo,
}: {
  changeSummaryAgainstRvo: ChangeSummaryAgainstRvo
}) {
  const contents =
    changeSummaryAgainstRvo.update === 0 &&
    changeSummaryAgainstRvo.keep === 0 &&
    changeSummaryAgainstRvo.ignore === 0 &&
    changeSummaryAgainstRvo.doNotClose === 0 ? (
      <div>
        <Check aria-hidden className="inline size-4" /> Alles zal in lijn zijn met de RVO.
      </div>
    ) : (
      <>
        <div>
          <ArrowLeftRight aria-hidden className="inline size-4" /> Vergeleken met de RVO,
        </div>
        <div className="flex flex-col gap-2">
          <UserChoicesSummaryItem value={changeSummaryAgainstRvo.ignore} label="is te negeren" />
          <UserChoicesSummaryItem value={changeSummaryAgainstRvo.keep} label="is te behouden" />
          <UserChoicesSummaryItem
            value={changeSummaryAgainstRvo.doNotClose}
            label="is niet af te sluiten"
          />
          <UserChoicesSummaryItem value={changeSummaryAgainstRvo.update} label="is gewijzigd" />
        </div>
      </>
    )

  return (
    <section
      aria-label="Uw keuzes voor de vergelijking met RVO"
      className="bg-card space-y-2 rounded-md border px-4 py-3 text-end text-sm"
    >
      {contents}
    </section>
  )
}

function UserChoicesSummaryItem({ value, label }: { value: number; label: string }) {
  if (value === 0) return null
  return (
    <div className="whitespace-nowrap">
      {value}
      <span className="text-muted-foreground text-sm">
        {" "}
        {value === 1 ? "perceel" : "percelen"} {label}
      </span>
    </div>
  )
}

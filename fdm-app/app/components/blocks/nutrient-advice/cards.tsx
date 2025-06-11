import { useState } from "react"
import type { NutrientDescription } from "./types"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
// import { Badge } from "../../ui/badge"

export function NutrientCard({
    description,
    advice,
}: {
    description: NutrientDescription
    advice: number
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    //   const recommendation = getRecommendationLevel(nutrient.value, nutrient.max)
    //   const percentage = nutrient.max ? Math.min((nutrient.value / nutrient.max) * 100, 100) : 0
    console.log(description)
    console.log(advice)
    return (
        <Card className="relative">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                            {description.symbol}
                        </div>
                        <CardTitle className="text-lg">
                            {description.name}
                        </CardTitle>
                    </div>
                    {/* <Badge variant={recommendation.variant}>{recommendation.level}</Badge> */}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center space-y-1">
                    <div className="text-4xl font-bold">
                        {advice.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {description.adviceUnit}
                    </div>
                </div>
                {/* {nutrient.max && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Application Level</span>
              <span>{percentage.toFixed(0)}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>
        )} */}

                {/* {applications.length > 0 && applications[0].name !== "No application required" && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="text-sm font-medium">View Applications</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-3">
              <Separator />
              <div className="space-y-3">
                {applications.map((app, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.timing}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {app.contribution} {nutrient.unit.split("/")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">{app.amount} kg/ha</p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )} */}
            </CardContent>
        </Card>
    )
}

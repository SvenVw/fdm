import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Card } from "~/components/ui/card"

export function MijnPercelenUploadAnimation({
    children,
    fieldNames,
}: {
    children: React.ReactNode
    fieldNames: string[]
}) {
    const [currentFieldIndex, setCurrentFieldIndex] = useState(0)

    useEffect(() => {
        if (fieldNames.length > 0) {
            const interval = setInterval(() => {
                setCurrentFieldIndex((prevIndex) => {
                    if (prevIndex < fieldNames.length - 1) {
                        return prevIndex + 1
                    }
                    clearInterval(interval)
                    return prevIndex
                })
            }, 150) // Time per field

            return () => clearInterval(interval)
        }
    }, [fieldNames])

    const currentFieldName = fieldNames[currentFieldIndex] || ""

    return (
        <div className="relative w-full max-w-lg mx-auto">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-md" />
            <div className="relative z-0">{children}</div>
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    <Card className="w-full">
                        <div className="p-6 text-center space-y-4">
                            <h3 className="text-lg font-semibold">
                                Percelen verwerken...
                            </h3>

                            <div className="text-2xl font-bold text-primary h-8 overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentFieldIndex}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        {currentFieldName}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {currentFieldIndex < fieldNames.length - 1
                                    ? `Perceel ${currentFieldIndex + 1} van ${fieldNames.length}`
                                    : "Voltooid!"}
                            </p>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

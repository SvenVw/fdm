import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"

interface Norm {
    normValue: number
    normSource: string
}

interface FieldNorm {
    b_id: string
    b_area: number
    norms: {
        manure: Norm
        phosphate: Norm
        nitrogen: Norm
    }
}

interface FieldNormsProps {
    fieldNorms: FieldNorm[]
    fieldOptions: {
        b_id: string
        b_name: string
    }[]
}

export function FieldNorms({ fieldNorms, fieldOptions }: FieldNormsProps) {
    const getFieldName = (b_id: string) => {
        return fieldOptions.find((field) => field.b_id === b_id)?.b_name
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6">Perceelniveau</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {fieldNorms.map((field) => (
                    <Card
                        key={field.b_id}
                        className="hover:shadow-md transition-shadow border-gray-200"
                    >
                        <CardHeader>
                            <div>
                                <CardTitle className="text-xl text-gray-900">
                                    {getFieldName(field.b_id)}
                                </CardTitle>
                                <CardDescription className="text-base font-medium text-gray-600">
                                    {`${field.b_area} ha`}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Stikstofgebruiksnorm */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        Stikstof
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {field.norms.nitrogen.normSource}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-gray-800">
                                        {field.norms.nitrogen.normValue}{" "}
                                        <span className="text-sm font-normal text-gray-600">
                                            kg N / ha
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Fosfaatgebruiksnorm */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        Fosfaat
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {field.norms.phosphate.normSource}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-gray-800">
                                        {field.norms.phosphate.normValue}{" "}
                                        <span className="text-sm font-normal text-gray-600">
                                            kg P2O5 /ha
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Dierlijke mest gebruiksnorm */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        Stikstof uit dierlijke mest
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {field.norms.manure.normSource}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-gray-800">
                                        {field.norms.manure.normValue}{" "}
                                        <span className="text-sm font-normal text-gray-600">
                                            kg N / ha
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

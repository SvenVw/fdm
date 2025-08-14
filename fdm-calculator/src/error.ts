/**
 * Represents a custom error originating from the `fdm-calculator` package.
 *
 * This class extends the native `Error` object to provide more context-specific
 * information when calculations or data validations fail. It includes a unique
 * error `code` for programmatic handling and an optional `context` object for
 * detailed debugging and user feedback.
 *
 * This allows consuming applications, such as `fdm-app`, to display targeted,
 * user-friendly error messages and guide users toward a resolution.
 *
 * @example
 * ```typescript
 * import { FdmCalculatorError } from './error';
 *
 * function calculateNorm(cultivation, year) {
 *   if (!cultivation) {
 *     throw new FdmCalculatorError(
 *       'Cultivation data is missing.',
 *       'CULTIVATION_NORM_NOT_FOUND',
 *       { year }
 *     );
 *   }
 *   // ...
 * }
 * ```
 *
 */
export class FdmCalculatorError extends Error {
    /**
     * A unique, machine-readable error code that identifies the nature of the error.
     *
     * This code allows for specific error handling and localization in the UI.
     *
     * __Proposed Error Codes:__
     *
     * - __Data and Input Validation:__
     *   - `MISSING_SOIL_PARAMETER`
     *   - `INVALID_FERTILIZER_DATA`
     *   - `INVALID_CULTIVATION_DATA`
     *   - `INVALID_APPLICATION_AMOUNT`
     *
     * - __Norm Calculation Errors:__
     *   - `CULTIVATION_NORM_NOT_FOUND`
     *   - `REGION_NOT_SUPPORTED`
     *   - `YEAR_NOT_SUPPORTED`
     *   - `PHOSPHATE_NORM_NOT_FOUND`
     *
     * - __External Service and API Failures:__
     *   - `API_FETCH_FAILED`
     *   - `API_TIMEOUT`
     *   - `GEOSPATIAL_PROCESSING_ERROR`
     *
     * - __General Calculation Failures:__
     *   - `CALCULATION_FAILED`
     *   - `NOT_IMPLEMENTED`
     *
     * @type {string}
     */
    public code: string

    /**
     * An optional object containing relevant data about the error.
     *
     * This payload provides additional details for debugging and can be used
     * to display dynamic, informative messages to the user.
     *
     * @example
     * ```json
     * {
     *   "fieldId": "fld-123",
     *   "cultivationCode": "CROP_456",
     *   "year": 2023
     * }
     * ```
     *
     * @type {Record<string, any> | undefined}
     */
    public context?: Record<string, any>

    /**
     * Creates an instance of FdmCalculatorError.
     *
     * @param {string} message A developer-focused error message for logging and debugging.
     * @param {string} code A unique, machine-readable error code.
     * @param {Record<string, any>} [context] An optional payload with contextual data.
     */
    constructor(message: string, code: string, context?: Record<string, any>) {
        super(message)
        this.name = "FdmCalculatorError"
        this.code = code
        this.context = context
    }
}

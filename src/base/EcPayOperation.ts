import { ICommand } from '../interfaces/ICommand'

/**
 * Base abstract class for ECPay operations/commands.
 * Implements ICommand interface to provide common functionality.
 */
export abstract class EcPayOperation implements ICommand {
    protected data: Record<string, any> = {}

    /**
     * Gets the API endpoint path for this operation.
     */
    abstract getRequestPath(): string

    /**
     * Retrieves the raw payload data.
     */
    getPayloadData(): Record<string, any> {
        return this.data
    }

    /**
     * Validates the operation data before sending.
     * Throws validation errors if requirements are not met.
     */
    abstract validate(): void
}

export interface ICommand {
    getRequestPath(): string
    getPayloadData(): Record<string, any>
    validate(): void
}

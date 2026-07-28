export class ValidationError extends Error {
    errors: any[] | undefined
    constructor(errors?: Array<any>) {
        super('Há erros de validação no formulário')
        this.name = 'ValidationError'
        this.errors = errors
    }
}
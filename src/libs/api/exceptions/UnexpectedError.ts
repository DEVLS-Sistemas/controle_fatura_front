export class UnexpectedError extends Error {
    constructor(message?: string) {
        super(message ? message : 'Erro inesperado. Tente novamente em breve!')
        this.name = 'UnexpectedError'
    }
}
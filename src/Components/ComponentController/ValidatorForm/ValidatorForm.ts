export interface ValidatorForm {

    message: string
    pattern?: string
    custom?: () => void
    value: any
    required?: boolean
}

export const required: ValidatorForm = {
    value: true,
    message: ''
}

export const minLength = (value: number) => {
    return {
        value,
        message: `Mínimo ${value} caracteres`
    }
}

export const maxLength = (value: number) => {
    return {
        value,
        message: `Máximo ${value} caracteres`
    }
}

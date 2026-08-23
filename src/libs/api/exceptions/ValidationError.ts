const FALLBACK = 'Há erros de validação no formulário'

function firstString(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = firstString(item)
            if (found) return found
        }
    }
    if (value && typeof value === 'object' && 'message' in value) {
        return firstString((value as { message?: unknown }).message)
    }
    return undefined
}

function messagesFromFieldMap(fields: unknown): string | undefined {
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return undefined
    for (const value of Object.values(fields as Record<string, unknown>)) {
        const found = firstString(value)
        if (found) return found
    }
    return undefined
}

/** Lê `message` do body 422 (auth e CRUDs) ou o primeiro erro de campo. */
export function resolveValidationMessage(body?: unknown): string {
    if (!body) return FALLBACK
    const fromBody = firstString(body)
    if (fromBody && fromBody !== FALLBACK) return fromBody

    const record = body as Record<string, unknown>
    const fromMessage = firstString(record.message)
    if (fromMessage) return fromMessage

    const fromFields =
        messagesFromFieldMap(record.errors) ||
        messagesFromFieldMap(record.data)
    if (fromFields) return fromFields

    return FALLBACK
}

export class ValidationError extends Error {
    errors: unknown

    constructor(errors?: unknown) {
        super(resolveValidationMessage(errors))
        this.name = 'ValidationError'
        this.errors = errors
    }
}

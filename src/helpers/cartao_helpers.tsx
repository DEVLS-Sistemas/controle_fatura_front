import React, { CSSProperties } from 'react'
import { ValidationError } from 'libs/api/exceptions/ValidationError'

export type CartaoCores = {
    cor_fundo?: string | null
    cor_texto?: string | null
}

/** Mensagem amigável de erros da API de cartões (ex.: 422 com fatura vinculada). */
export const extractCartaoErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof ValidationError) {
        const body = error.errors as any
        if (typeof body?.message === 'string' && body.message.trim()) return body.message
        if (typeof body?.cartao?.message === 'string' && body.cartao.message.trim()) {
            return body.cartao.message
        }
        if (typeof body === 'string' && body.trim()) return body
    }
    if (error instanceof Error && error.message?.trim()) return error.message
    return fallback
}

export const cartaoChipStyle = (
    corFundo?: string | null,
    corTexto?: string | null
): CSSProperties | undefined => {
    if (!corFundo) return undefined
    return {
        backgroundColor: corFundo,
        color: corTexto || '#ffffff',
    }
}

export const CartaoChip = ({
    cor_fundo,
    cor_texto,
    label,
    title,
    className = '',
}: CartaoCores & {
    label?: React.ReactNode
    title?: string
    className?: string
}) => {
    if (!cor_fundo && label == null) return null

    if (label == null) {
        return (
            <span
                className={`d-inline-block rounded border flex-shrink-0 ${className}`.trim()}
                style={{
                    width: 18,
                    height: 18,
                    backgroundColor: cor_fundo || undefined,
                    boxShadow: cor_texto
                        ? `inset 0 0 0 3px ${cor_texto}`
                        : undefined,
                }}
                title={title || undefined}
            />
        )
    }

    return (
        <span
            className={`badge align-middle ${className}`.trim()}
            style={{
                ...cartaoChipStyle(cor_fundo, cor_texto),
                border: cor_fundo ? '1px solid rgba(0,0,0,0.08)' : undefined,
            }}
            title={title || undefined}
        >
            {label}
        </span>
    )
}

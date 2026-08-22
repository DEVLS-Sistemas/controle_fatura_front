import React, { CSSProperties } from 'react'
import { ValidationError } from 'libs/api/exceptions/ValidationError'
import {
    BANDEIRA_COR_PADRAO,
    BANDEIRA_PRESETS_CORES_PADRAO,
    bandeirasSelectLabels,
    CARTAO_COR_PADRAO,
    matchPresetCorBandeira,
    matchPresetCorCartao,
    PresetBandeiraLookup,
    ParCorBandeiraLookup,
} from 'interfaces/Cartoes/CartoesInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'

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

export const resolveCartaoCores = (cartao?: {
    nome?: string | null
    banco?: string | null
    cor_fundo?: string | null
    cor_texto?: string | null
} | null): { cor_fundo: string; cor_texto: string } => {
    if (cartao?.cor_fundo) {
        return {
            cor_fundo: cartao.cor_fundo,
            cor_texto: cartao.cor_texto || '#ffffff',
        }
    }
    const matched = matchPresetCorCartao(cartao?.nome, cartao?.banco, undefined, CARTAO_COR_PADRAO)
    return {
        cor_fundo: matched.cor_fundo,
        cor_texto: matched.cor_texto,
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

export type BandeiraCoresInput = {
    bandeira?: string | null
    nome?: string | null
    label?: string | null
    cor_principal?: string | null
    cor_secundaria?: string | null
}

export const resolveBandeiraCores = (
    bandeira?: BandeiraCoresInput | null
): { cor_principal: string; cor_secundaria: string } => {
    if (bandeira?.cor_principal) {
        return {
            cor_principal: bandeira.cor_principal,
            cor_secundaria: bandeira.cor_secundaria || BANDEIRA_COR_PADRAO.cor_secundaria,
        }
    }
    const matched = matchPresetCorBandeira(
        bandeira?.bandeira ?? bandeira?.nome ?? bandeira?.label
    )
    return {
        cor_principal: matched.cor_principal,
        cor_secundaria: matched.cor_secundaria,
    }
}

export const toBandeiraSelectOption = (
    value: string | number | null | undefined,
    label: string,
    cores?: { cor_principal?: string | null; cor_secundaria?: string | null }
): SelectOptions => {
    const resolved = resolveBandeiraCores({
        label,
        cor_principal: cores?.cor_principal,
        cor_secundaria: cores?.cor_secundaria,
    })
    return {
        value,
        label,
        cor_principal: resolved.cor_principal,
        cor_secundaria: resolved.cor_secundaria,
    }
}

export const buildBandeiraSelectOptions = (
    labels?: string[] | null,
    presets: PresetBandeiraLookup[] = BANDEIRA_PRESETS_CORES_PADRAO,
    fallback: ParCorBandeiraLookup = BANDEIRA_COR_PADRAO
): SelectOptions[] =>
    bandeirasSelectLabels(labels).map((label) => {
        const cores = matchPresetCorBandeira(label, presets, fallback)
        return {
            value: label,
            label,
            cor_principal: cores.cor_principal,
            cor_secundaria: cores.cor_secundaria,
        }
    })

export const BandeiraChip = ({
    cor_principal,
    cor_secundaria,
    bandeira,
    nome,
    label,
    title,
    className = '',
}: BandeiraCoresInput & {
    label?: React.ReactNode
    title?: string
    className?: string
}) => {
    const cores = resolveBandeiraCores({
        cor_principal,
        cor_secundaria,
        bandeira,
        nome,
        label: typeof label === 'string' ? label : undefined,
    })
    const nomeBandeira = typeof label === 'string'
        ? label
        : (bandeira || nome || undefined)
    const circles = (
        <span className="bandeira-chip__circles" aria-hidden="true">
            <span
                className="bandeira-chip__circle bandeira-chip__circle--primary"
                style={{ backgroundColor: cores.cor_principal }}
            />
            <span
                className="bandeira-chip__circle bandeira-chip__circle--secondary"
                style={{ backgroundColor: cores.cor_secundaria }}
            />
        </span>
    )

    if (label == null) {
        return (
            <span
                className={`bandeira-chip ${className}`.trim()}
                title={title || nomeBandeira}
            >
                {circles}
            </span>
        )
    }

    return (
        <span
            className={`bandeira-chip ${className}`.trim()}
            title={title || nomeBandeira}
        >
            {circles}
            <span className="bandeira-chip__label">{label}</span>
        </span>
    )
}

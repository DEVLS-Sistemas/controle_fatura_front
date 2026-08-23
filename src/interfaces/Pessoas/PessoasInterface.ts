import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'

export interface PessoasSearch {
    id?: string | null
    pessoa_id?: string | number | null
    nome?: string | null
    ativo?: boolean | string | null
    palavra_chave?: string | null | unknown
}

export interface PessoasList {
    id?: number
    pessoa_id?: number
    nome?: string
    sobrenome?: string | null
    nome_completo?: string | null
    cpf_cnpj?: string | null
    eh_principal?: boolean
    ativo?: boolean
}

export interface PessoasView extends PessoasList {}

export interface PessoasModel {
    id?: number | null
    pessoa_id?: number | null
    nome: string | null
    sobrenome?: string | null
    cpf_cnpj?: string | null
    eh_principal?: boolean
    ativo?: boolean
}

/** Item de `GET /pessoas/pessoas-list` (value/label ou modelo completo) */
export type PessoaListItem = {
    value?: number | string
    label?: string
    id?: number
    pessoa_id?: number
    nome?: string
    sobrenome?: string | null
    nome_completo?: string | null
    eh_principal?: boolean
    ativo?: boolean
}

export interface LookupsPessoas {}

export interface PessoasInterface {
    getViewPessoas(params: any): Promise<PessoasView | undefined>
    listPessoasPaginate(params: PessoasSearch): Promise<any>
    AsyncListPessoas(params?: PessoasSearch): Promise<PessoaListItem[] | undefined>
    createPessoas(params: PessoasModel): Promise<any>
    editPessoas(params: PessoasModel): Promise<any>
    deletePessoas(id: number): Promise<any>
}

export const PessoasDefaultValues: PessoasModel = {
    id: null,
    pessoa_id: null,
    nome: null,
    sobrenome: null,
    cpf_cnpj: null,
    eh_principal: false,
    ativo: true,
}

export const pessoaNomeCompleto = (
    pessoa?: {
        nome?: string | null
        sobrenome?: string | null
        nome_completo?: string | null
        label?: string | null
    } | null
): string => {
    if (!pessoa) return ''
    if (pessoa.nome_completo?.trim()) return pessoa.nome_completo.trim()
    if (pessoa.label?.trim()) return pessoa.label.trim()
    return [pessoa.nome, pessoa.sobrenome]
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean)
        .join(' ')
}

export const pessoaIdOf = (pessoa?: { id?: number | string | null; pessoa_id?: number | string | null; value?: number | string | null } | null): number | null => {
    const raw = pessoa?.pessoa_id ?? pessoa?.id ?? pessoa?.value
    if (raw == null || raw === '') return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
}

export const toPessoaSelectOption = (pessoa: PessoaListItem): SelectOptions => {
    const id = pessoaIdOf(pessoa)
    const nome = pessoaNomeCompleto(pessoa)
    const suffix = pessoa.eh_principal ? ' · principal' : ''
    return {
        value: id ?? '',
        label: `${nome || `Pessoa ${id}`}${suffix}`,
    }
}

export const normalizePessoasList = (body: unknown): PessoaListItem[] => {
    if (Array.isArray(body)) return body
    if (body && typeof body === 'object') {
        const record = body as Record<string, unknown>
        if (Array.isArray(record.data)) return record.data as PessoaListItem[]
        if (Array.isArray(record.pessoas)) return record.pessoas as PessoaListItem[]
    }
    return []
}

/** Primeiro token = nome; resto = sobrenome (ex.: "MAYS A ARAUJO…" → nome + sobrenome) */
export const splitNomePessoa = (completo?: string | null): { nome: string; sobrenome: string } => {
    const parts = String(completo ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
    if (parts.length === 0) return { nome: '', sobrenome: '' }
    if (parts.length === 1) return { nome: parts[0], sobrenome: '' }
    return { nome: parts[0], sobrenome: parts.slice(1).join(' ') }
}

export const onlyDigits = (value?: string | null): string =>
    String(value ?? '').replace(/\D/g, '')

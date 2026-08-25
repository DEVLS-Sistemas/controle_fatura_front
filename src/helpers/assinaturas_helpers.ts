import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  AssinaturaCobranca,
  AssinaturaItem,
  AssinaturaLookupOption,
  AssinaturaStatusFiltro,
  AssinaturasDefaultValues,
  AssinaturasSearch,
} from 'interfaces/Assinaturas/AssinaturasInterface'

export const STATUS_TABS: { value: AssinaturaStatusFiltro; label: string }[] = [
  { value: 'todas', label: 'Lista' },
  { value: 'ignorada', label: 'Ignoradas' },
]

export const isEhAssinatura = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || value === 'true'

export const isCompraAvista = (row?: {
  compra_grupo_id?: string | number | null
  parcelas_total?: number | string | null
} | null): boolean => {
  if (!row) return true
  if (row.compra_grupo_id) return false
  const n = Number(row.parcelas_total ?? 1)
  return !Number.isFinite(n) || n <= 1
}

export const podeConfirmarAssinatura = (item: AssinaturaItem): boolean => {
  if (item.pode_confirmar === false) return false
  if (item.pode_confirmar === true) return true
  const acoes = item.acoes_disponiveis ?? []
  if (acoes.length) return acoes.includes('confirmar')
  return item.status === 'candidata'
}

export const acoesAssinatura = (item: AssinaturaItem): string[] => {
  if (Array.isArray(item.acoes_disponiveis) && item.acoes_disponiveis.length) {
    return item.acoes_disponiveis.map(String)
  }
  if (item.status === 'candidata') return ['confirmar', 'ignorar']
  if (item.status === 'confirmada') return ['desfazer_confirmacao']
  if (item.status === 'ignorada') return ['restaurar']
  return []
}

export const statusAssinaturaBadge = (
  status?: string | null,
  statusLabel?: string | null
): { color: string; label: string } => {
  switch (status) {
    case 'candidata':
      return { color: 'warning', label: 'Possível assinatura' }
    case 'confirmada':
      return { color: 'success', label: 'Assinatura' }
    case 'ignorada':
      return { color: 'secondary', label: 'Ignorada' }
    default:
      return { color: 'light', label: statusLabel || status || 'Assinatura' }
  }
}

export const emptyAssinaturasMessage = (
  status?: string | null
): { title: string; text: string } => {
  if (status === 'ignorada') {
    return {
      title: 'Você não ignorou nenhuma.',
      text: 'Sugestões recusadas ficam só nesta lista e podem ser restauradas a qualquer momento.',
    }
  }
  return {
    title: 'Nenhuma assinatura confirmada.',
    text: 'Marque na compra ou confirme uma sugestão acima.',
  }
}

export const lookupToSelectOptions = (
  items: AssinaturaLookupOption[] | undefined,
  options?: { includeAll?: boolean; allLabel?: string }
): SelectOptions[] => {
  const opts: SelectOptions[] = []
  if (options?.includeAll) {
    opts.push({ value: '', label: options.allLabel ?? 'Todas' })
  }
  items?.forEach((item) => {
    if (item?.value == null || item.value === '') return
    opts.push({
      value: item.value,
      label: item.label ?? String(item.value),
    })
  })
  return opts
}

export const idLookupToSelectOptions = (
  items:
    | {
        id?: number
        nome?: string
        cor?: string | null
        cor_fundo?: string | null
        cor_texto?: string | null
      }[]
    | undefined,
  allLabel = 'Todos'
): SelectOptions[] => {
  const opts: SelectOptions[] = [{ value: '', label: allLabel }]
  items?.forEach((item) => {
    if (item.id == null) return
    opts.push({
      value: item.id,
      label: item.nome ?? `#${item.id}`,
      cor: item.cor ?? null,
      cor_fundo: item.cor_fundo ?? null,
      cor_texto: item.cor_texto ?? null,
    })
  })
  return opts
}

export const subtittleMaquininha = (item: AssinaturaItem): string | null => {
  const loja = (item.loja_nome || '').trim()
  const estabelecimento = (item.estabelecimento_nome || '').trim()
  if (loja && estabelecimento && loja.toLowerCase() !== estabelecimento.toLowerCase()) {
    return estabelecimento
  }
  return null
}

export const cobrancaDestino = (cobranca: AssinaturaCobranca): string | null => {
  const id = cobranca.id ?? cobranca.transacao_id
  if (id == null || id === '') return null
  return `/compras/${encodeURIComponent(String(id))}`
}

export const mensagemAcaoAssinatura = (acao: AssinaturaAcao, apiMessage?: string | null): string => {
  if (apiMessage) return apiMessage
  switch (acao) {
    case 'confirmar':
      return 'Assinatura confirmada e incluída na lista oficial'
    case 'ignorar':
      return 'Sugestão ignorada'
    case 'restaurar':
      return 'Assinatura restaurada'
    case 'desfazer_confirmacao':
      return 'Removida da lista de assinaturas'
    default:
      return 'Assinatura atualizada'
  }
}

export const resolveAssinaturasSearch = (
  searchParams?: URLSearchParams
): AssinaturasSearch => {
  const status = searchParams?.get('status') || AssinaturasDefaultValues.status
  const periodicidade = searchParams?.get('periodicidade') || null
  const ordenar = searchParams?.get('ordenar') || AssinaturasDefaultValues.ordenar
  const palavra = searchParams?.get('palavra_chave') || null
  const cartao = searchParams?.get('cartao_id')
  const responsavel = searchParams?.get('responsavel_id')
  const categoria = searchParams?.get('categoria_id')

  return {
    status,
    periodicidade,
    ordenar,
    palavra_chave: palavra,
    cartao_id: cartao ? Number(cartao) || cartao : null,
    responsavel_id: responsavel ? Number(responsavel) || responsavel : null,
    categoria_id: categoria ? Number(categoria) || categoria : null,
  }
}

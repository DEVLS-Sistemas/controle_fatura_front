import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  AssinaturaAcao,
  AssinaturaCobranca,
  AssinaturaItem,
  AssinaturaLookupOption,
  AssinaturaStatusFiltro,
  AssinaturasDefaultValues,
  AssinaturasSearch,
} from 'interfaces/Assinaturas/AssinaturasInterface'

export const STATUS_TABS: { value: AssinaturaStatusFiltro; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'candidata', label: 'Candidatas' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'ignorada', label: 'Ignoradas' },
]

export const statusAssinaturaBadge = (
  status?: string | null,
  statusLabel?: string | null
): { color: string; label: string } => {
  switch (status) {
    case 'candidata':
      return { color: 'warning', label: 'Possível assinatura' }
    case 'confirmada':
      return { color: 'success', label: 'Pagamento de serviços' }
    case 'ignorada':
      return { color: 'secondary', label: 'Ignorada' }
    default:
      return { color: 'light', label: statusLabel || status || 'Assinatura' }
  }
}

export const emptyAssinaturasMessage = (
  status?: string | null
): { title: string; text: string } => {
  if (status === 'candidata') {
    return {
      title: 'Nada para revisar.',
      text: 'Quando uma cobrança se repetir com valor parecido, ela aparece aqui para você confirmar.',
    }
  }
  if (status === 'ignorada') {
    return {
      title: 'Você não ignorou nenhuma.',
      text: 'Itens ignorados ficam só nesta aba e podem ser restaurados a qualquer momento.',
    }
  }
  if (status === 'confirmada') {
    return {
      title: 'Nenhuma assinatura confirmada.',
      text: 'Confirme as candidatas para marcá-las como pagamento de serviços.',
    }
  }
  return {
    title: 'Ainda não encontramos assinaturas.',
    text: 'Elas aparecem quando a mesma cobrança se repete (ex.: Netflix todo mês).',
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
      return 'Cobranças marcadas como pagamento de serviços'
    case 'ignorar':
      return 'Assinatura ignorada'
    case 'restaurar':
      return 'Assinatura restaurada'
    case 'desfazer_confirmacao':
      return 'Confirmação desfeita'
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

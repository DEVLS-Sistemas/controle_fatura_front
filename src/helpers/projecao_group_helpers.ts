import type {
  ProjecaoFonte,
  ProjecaoPorCartao,
  ProjecaoPorCartaoResponsavel,
  ProjecaoPorResponsavel,
  ProjecaoResumoEuOutros,
  ProjecaoSplitParte,
  ProjecaoUsoLimite,
  ProjecaoValor,
} from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'

export const chaveNomeCartao = (nome?: string | null): string =>
  String(nome ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

export const idGrupoCartao = (nome?: string | null): string =>
  `grupo-${chaveNomeCartao(nome).replace(/\s+/g, '-') || 'cartao'}`

export type CartaoProjecaoAgrupado<T extends ProjecaoPorCartao = ProjecaoPorCartao> = T & {
  qtd_cartoes: number
  cartao_ids: number[]
  agrupado: boolean
}

const emptySplit = (): ProjecaoSplitParte => ({
  realizado: 0,
  projetado: 0,
  total: 0,
  percentual: null,
  percentual_do_limite: null,
})

export const mergeFonte = (a?: ProjecaoFonte, b?: ProjecaoFonte): ProjecaoFonte => {
  if (!a) return b ?? 'vazio'
  if (!b) return a
  if (a === b) return a
  if (a === 'vazio') return b
  if (b === 'vazio') return a
  return 'misto'
}

const soma = (itens: Array<number | null | undefined>): number =>
  itens.reduce((acc, v) => acc + Number(v || 0), 0)

const mergeSplit = (
  partes: Array<ProjecaoSplitParte | null | undefined>,
  totalGasto: number,
  limite: number | null
): ProjecaoSplitParte | undefined => {
  const validas = partes.filter(Boolean) as ProjecaoSplitParte[]
  if (!validas.length) return undefined
  const realizado = soma(validas.map((p) => p.realizado))
  const projetado = soma(validas.map((p) => p.projetado))
  const total = soma(validas.map((p) => p.total))
  return {
    realizado,
    projetado,
    total,
    percentual: totalGasto > 0 ? (total / totalGasto) * 100 : total > 0 ? 100 : null,
    percentual_do_limite: limite && limite > 0 ? (total / limite) * 100 : null,
  }
}

const mergeLimiteCredito = (itens: Array<number | null | undefined>): number | null => {
  const limites = itens.filter((v): v is number => v != null && !Number.isNaN(Number(v)))
  if (!limites.length) return null
  return limites.reduce((a, b) => a + Number(b), 0)
}

const mergeUsoLimite = (
  usos: Array<ProjecaoUsoLimite | null | undefined>,
  limiteGrupo: number | null
): ProjecaoUsoLimite | null => {
  const validos = usos.filter(Boolean) as ProjecaoUsoLimite[]
  if (!validos.length) return null
  const emUso = soma(validos.map((u) => u.em_uso))
  const livre = limiteGrupo != null ? limiteGrupo - emUso : soma(validos.map((u) => u.livre))
  return {
    limite: limiteGrupo,
    em_uso: emUso,
    livre,
    percentual_em_uso: limiteGrupo && limiteGrupo > 0 ? (emUso / limiteGrupo) * 100 : null,
    percentual_livre: limiteGrupo && limiteGrupo > 0 ? (livre / limiteGrupo) * 100 : null,
    meu: mergeSplit(validos.map((u) => u.meu), emUso, limiteGrupo),
    outros: mergeSplit(validos.map((u) => u.outros), emUso, limiteGrupo),
  }
}

const mergeValor = (itens: ProjecaoValor[], limiteGrupo: number | null): ProjecaoValor => {
  const realizado = soma(itens.map((i) => i.realizado))
  const projetado = soma(itens.map((i) => i.projetado))
  const total = soma(itens.map((i) => i.total))
  const emUso = soma(itens.map((i) => i.em_uso ?? i.total))
  const livres = itens.map((i) => i.livre ?? i.disponivel).filter((v): v is number => v != null)
  const livre = limiteGrupo != null ? limiteGrupo - emUso : livres.length === itens.length ? soma(livres) : null
  const fonte = itens.reduce<ProjecaoFonte>((acc, item) => mergeFonte(acc, item.fonte), itens[0]?.fonte ?? 'vazio')
  const simulado = soma(itens.map((i) => i.simulado))
  const totalAntes = itens.some((i) => i.total_antes != null || Number(i.simulado) > 0)
    ? soma(itens.map((i) => Number(i.total_antes ?? Number(i.total || 0) - Number(i.simulado || 0))))
    : undefined
  return {
    realizado,
    projetado,
    total,
    fonte: simulado > 0 && fonte === 'vazio' ? 'projecao' : fonte,
    em_uso: emUso,
    livre,
    disponivel: livre,
    percentual_utilizado: limiteGrupo && limiteGrupo > 0 ? (emUso / limiteGrupo) * 100 : null,
    percentual_livre: limiteGrupo && limiteGrupo > 0 && livre != null ? (livre / limiteGrupo) * 100 : null,
    meu: mergeSplit(itens.map((i) => i.meu), total, limiteGrupo),
    outros: mergeSplit(itens.map((i) => i.outros), total, limiteGrupo),
    ...(simulado > 0 ? { simulado, total_antes: totalAntes } : {}),
  }
}

const mergeValores = (listas: ProjecaoValor[][], limiteGrupo: number | null): ProjecaoValor[] => {
  const len = Math.max(0, ...listas.map((lista) => lista.length))
  return Array.from({ length: len }, (_, idx) => {
    const itens = listas.map((lista) => lista[idx]).filter(Boolean)
    if (!itens.length) {
      return {
        realizado: 0,
        projetado: 0,
        total: 0,
        fonte: 'vazio' as ProjecaoFonte,
      }
    }
    return mergeValor(itens, limiteGrupo)
  })
}

const mergeResumoEuOutros = (
  listas: Array<ProjecaoResumoEuOutros[] | undefined>
): ProjecaoResumoEuOutros[] | undefined => {
  const validas = listas.filter((lista): lista is ProjecaoResumoEuOutros[] => Array.isArray(lista) && lista.length > 0)
  if (!validas.length) return undefined
  const len = Math.max(...validas.map((lista) => lista.length))
  return Array.from({ length: len }, (_, idx) => {
    const itens = validas.map((lista) => lista[idx]).filter(Boolean)
    const total = soma(itens.map((i) => i.total))
    return {
      total,
      meu: mergeSplit(itens.map((i) => i.meu), total, null) ?? emptySplit(),
      outros: mergeSplit(itens.map((i) => i.outros), total, null) ?? emptySplit(),
    }
  })
}

const agruparPorNome = <T extends ProjecaoPorCartao>(linhas: T[]): T[][] => {
  const grupos = new Map<string, T[]>()
  linhas.forEach((linha) => {
    const chave = chaveNomeCartao(linha.nome) || `id-${linha.cartao_id}`
    const atual = grupos.get(chave) || []
    atual.push(linha)
    grupos.set(chave, atual)
  })
  return Array.from(grupos.values())
}

const mergeCartaoBase = <T extends ProjecaoPorCartao>(itens: T[]): CartaoProjecaoAgrupado<T> => {
  const cartaoIds = itens.map((item) => item.cartao_id)
  if (itens.length === 1) {
    return {
      ...itens[0],
      qtd_cartoes: 1,
      cartao_ids: cartaoIds,
      agrupado: false,
    }
  }

  const limiteCredito = mergeLimiteCredito(itens.map((item) => item.limite_credito))
  const valores = mergeValores(itens.map((item) => item.valores || []), limiteCredito)
  const usoLimite = mergeUsoLimite(itens.map((item) => item.uso_limite), limiteCredito)

  return {
    ...itens[0],
    qtd_bandeiras: soma(itens.map((item) => item.qtd_bandeiras)),
    limite_credito: limiteCredito,
    uso_limite: usoLimite,
    valores,
    total: soma(itens.map((item) => item.total)),
    resumo_eu_outros: mergeResumoEuOutros(itens.map((item) => item.resumo_eu_outros)),
    pessoa_id: null,
    pessoa_nome: null,
    bandeira: undefined,
    ultimos_digitos: undefined,
    qtd_cartoes: itens.length,
    cartao_ids: cartaoIds,
    agrupado: true,
  }
}

export const agruparCartoesPorNome = (linhas: ProjecaoPorCartao[]): CartaoProjecaoAgrupado[] =>
  agruparPorNome(linhas).map((itens) => mergeCartaoBase(itens))

const mergeResponsaveis = (listas: ProjecaoPorResponsavel[][]): ProjecaoPorResponsavel[] => {
  const porId = new Map<number, ProjecaoPorResponsavel[]>()
  listas.forEach((lista) => {
    (lista || []).forEach((resp) => {
      const atual = porId.get(resp.responsavel_id) || []
      atual.push(resp)
      porId.set(resp.responsavel_id, atual)
    })
  })

  return Array.from(porId.values()).map((itens) => {
    if (itens.length === 1) return itens[0]
    const valores = mergeValores(itens.map((item) => item.valores || []), null)
    return {
      ...itens[0],
      valores,
      total: soma(itens.map((item) => item.total)),
    }
  })
}

const aplicarParticipacao = (
  cartao: ProjecaoPorCartaoResponsavel
): ProjecaoPorCartaoResponsavel => ({
  ...cartao,
  por_responsavel: (cartao.por_responsavel || []).map((resp) => ({
    ...resp,
    valores: (resp.valores || []).map((valor, idx) => {
      const totalCartao = Number(cartao.valores?.[idx]?.total || 0)
      return {
        ...valor,
        percentual_participacao: totalCartao > 0 ? (Number(valor.total || 0) / totalCartao) * 100 : null,
      }
    }),
  })),
})

export const agruparCruzamentoPorNome = (
  linhas: ProjecaoPorCartaoResponsavel[]
): CartaoProjecaoAgrupado<ProjecaoPorCartaoResponsavel>[] =>
  agruparPorNome(linhas).map((itens) => {
    const base = mergeCartaoBase(itens)
    if (!base.agrupado) {
      return { ...base, por_responsavel: itens[0].por_responsavel || [] }
    }
    return aplicarParticipacao({
      ...base,
      por_responsavel: mergeResponsaveis(itens.map((item) => item.por_responsavel || [])),
    })
  })

export const sublabelCartao = (
  cartao: ProjecaoPorCartao,
  opts: { separarTitular: boolean; qtdCartoes?: number }
): string => {
  const qtdCartoes = opts.qtdCartoes ?? 1
  const qtdBandeiras = cartao.qtd_bandeiras
  const bandeiras =
    qtdBandeiras != null && qtdBandeiras > 0
      ? `${qtdBandeiras} ${qtdBandeiras === 1 ? 'bandeira' : 'bandeiras'}`
      : null

  if (opts.separarTitular) {
    return [cartao.pessoa_nome, bandeiras, cartao.bandeira, cartao.ultimos_digitos ? `•••• ${cartao.ultimos_digitos}` : null]
      .filter(Boolean)
      .join(' · ')
  }

  return [
    qtdCartoes > 1 ? `${qtdCartoes} cartões` : null,
    bandeiras,
    qtdCartoes === 1 ? cartao.bandeira : null,
    qtdCartoes === 1 && cartao.ultimos_digitos ? `•••• ${cartao.ultimos_digitos}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export const chaveTitular = (pessoaId?: number | null, pessoaNome?: string | null): string => {
  if (pessoaId != null) return `id-${pessoaId}`
  const nome = chaveNomeCartao(pessoaNome)
  return nome ? `nome-${nome}` : 'sem-titular'
}

export const labelTitular = (pessoaNome?: string | null): string =>
  pessoaNome?.trim() || 'Sem titular'

export type ResponsavelPorTitular = ProjecaoPorResponsavel & {
  pessoa_id: number | null
  pessoa_nome: string | null
  pessoa_eh_principal: boolean
  cartao_ids: number[]
}

const unicos = (ids: number[]): number[] => Array.from(new Set(ids))

const aplicarParticipacaoNasLinhas = (linhas: ResponsavelPorTitular[]): ResponsavelPorTitular[] => {
  const totaisPorColuna = new Map<string, number[]>()
  linhas.forEach((linha) => {
    const chave = chaveTitular(linha.pessoa_id, linha.pessoa_nome)
    const totais = totaisPorColuna.get(chave) || []
    ;(linha.valores || []).forEach((valor, idx) => {
      totais[idx] = Number(totais[idx] || 0) + Number(valor.total || 0)
    })
    totaisPorColuna.set(chave, totais)
  })

  return linhas.map((linha) => {
    const totais = totaisPorColuna.get(chaveTitular(linha.pessoa_id, linha.pessoa_nome)) || []
    return {
      ...linha,
      valores: (linha.valores || []).map((valor, idx) => ({
        ...valor,
        percentual_participacao: totais[idx] > 0 ? (Number(valor.total || 0) / totais[idx]) * 100 : null,
      })),
    }
  })
}

export const separarResponsaveisPorTitular = (
  cruzamento: ProjecaoPorCartaoResponsavel[]
): ResponsavelPorTitular[] => {
  const grupos = new Map<string, ResponsavelPorTitular[]>()

  cruzamento.forEach((cartao) => {
    const pessoaId = cartao.pessoa_id ?? null
    const pessoaLabel = labelTitular(cartao.pessoa_nome)
    const pessoaEhPrincipal = cartao.pessoa_eh_principal === true
    ;(cartao.por_responsavel || []).forEach((resp) => {
      const chave = `${chaveTitular(pessoaId, cartao.pessoa_nome)}|${resp.responsavel_id}`
      const atual = grupos.get(chave) || []
      atual.push({
        ...resp,
        eh_eu: resp.eh_eu === true && pessoaEhPrincipal,
        pessoa_id: pessoaId,
        pessoa_nome: pessoaLabel,
        pessoa_eh_principal: pessoaEhPrincipal,
        cartao_ids: [cartao.cartao_id],
      })
      grupos.set(chave, atual)
    })
  })

  const linhas = Array.from(grupos.values()).map((itens) => {
    if (itens.length === 1) return itens[0]
    return {
      ...itens[0],
      valores: mergeValores(itens.map((item) => item.valores || []), null),
      total: soma(itens.map((item) => item.total)),
      cartao_ids: unicos(itens.flatMap((item) => item.cartao_ids)),
    }
  })

  return aplicarParticipacaoNasLinhas(linhas)
    .filter((linha) => Number(linha.total) > 0)
    .sort((a, b) => {
      const titular = labelTitular(a.pessoa_nome).localeCompare(labelTitular(b.pessoa_nome), 'pt-BR')
      if (titular !== 0) return titular
      if (Boolean(a.eh_eu) !== Boolean(b.eh_eu)) return a.eh_eu ? -1 : 1
      return String(a.nome).localeCompare(String(b.nome), 'pt-BR')
    })
}

export const resumosEuOutrosPorTitular = (
  linhas: ResponsavelPorTitular[],
  idxReferencia: number
): Array<{ titulo: string; resumo: ProjecaoResumoEuOutros }> => {
  const grupos = new Map<string, ResponsavelPorTitular[]>()
  linhas.forEach((linha) => {
    const chave = chaveTitular(linha.pessoa_id, linha.pessoa_nome)
    const atual = grupos.get(chave) || []
    atual.push(linha)
    grupos.set(chave, atual)
  })

  return Array.from(grupos.values())
    .map((itens) => {
      const meu = itens.filter((item) => item.eh_eu === true)
      const outros = itens.filter((item) => item.eh_eu !== true)
      const totalMeu = soma(meu.map((item) => item.valores?.[idxReferencia]?.total))
      const totalOutros = soma(outros.map((item) => item.valores?.[idxReferencia]?.total))
      const total = totalMeu + totalOutros
      const parte = (grupo: ResponsavelPorTitular[], totalGrupo: number): ProjecaoSplitParte => ({
        realizado: soma(grupo.map((item) => item.valores?.[idxReferencia]?.realizado)),
        projetado: soma(grupo.map((item) => item.valores?.[idxReferencia]?.projetado)),
        total: totalGrupo,
        percentual: total > 0 ? (totalGrupo / total) * 100 : totalGrupo > 0 ? 100 : null,
        percentual_do_limite: null,
      })
      return {
        titulo: labelTitular(itens[0]?.pessoa_nome),
        resumo: {
          total,
          meu: parte(meu, totalMeu),
          outros: parte(outros, totalOutros),
        },
      }
    })
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
}

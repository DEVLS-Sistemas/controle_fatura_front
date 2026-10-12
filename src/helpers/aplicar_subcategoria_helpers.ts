import { isEhAssinatura } from 'helpers/assinaturas_helpers'

export type AplicarSubcategoriaPergunta = {
    perguntar: true
    estabelecimento_id: number | null
    estabelecimento_nome: string
    linhas_nesta_fatura: number
    parcelas_outras_faturas: number
    somente_categoria: boolean
}

export type LinhaClassificacaoGrupo = {
    id?: number | string | null
    compra_grupo_id?: string | number | null
    categoria_id?: number | string | null
    subcategoria_id?: number | string | null
}

function numero(value: unknown): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function idVazio(value: unknown): boolean {
    if (value == null) return true
    if (typeof value === 'string' && value.trim() === '') return true
    const parsed = Number(value)
    return !Number.isFinite(parsed) || parsed <= 0
}

export function parseAplicarSubcategoria(body: unknown): AplicarSubcategoriaPergunta | null {
    if (!body || typeof body !== 'object') return null
    const transacao = (body as { transacao?: unknown }).transacao
    if (!transacao || typeof transacao !== 'object') return null
    const raw = (transacao as { aplicar_subcategoria?: unknown }).aplicar_subcategoria
    if (!raw || typeof raw !== 'object') return null
    const obj = raw as Record<string, unknown>
    if (obj.perguntar !== true) return null
    const estabelecimentoId = obj.estabelecimento_id == null || obj.estabelecimento_id === ''
        ? null
        : numero(obj.estabelecimento_id)
    return {
        perguntar: true,
        estabelecimento_id: estabelecimentoId,
        estabelecimento_nome: String(obj.estabelecimento_nome ?? '').trim(),
        linhas_nesta_fatura: numero(obj.linhas_nesta_fatura),
        parcelas_outras_faturas: numero(obj.parcelas_outras_faturas),
        somente_categoria: obj.somente_categoria === true,
    }
}

/**
 * O checkbox segue `transacao.data.eh_assinatura`.
 * Classificar com o checkbox desmarcado devolve false e não liga a assinatura.
 * Sem o campo, o checkbox fica como o usuário deixou.
 */
export function ehAssinaturaDaResposta(body: unknown): boolean | null {
    if (!body || typeof body !== 'object') return null
    const transacao = (body as { transacao?: unknown }).transacao
    if (!transacao || typeof transacao !== 'object') return null
    const data = (transacao as { data?: unknown }).data
    if (!data || typeof data !== 'object' || !('eh_assinatura' in data)) return null
    return isEhAssinatura((data as { eh_assinatura?: unknown }).eh_assinatura)
}

/**
 * Outras parcelas da mesma compra já recebem categoria/subcategoria no primeiro
 * save. Linha com subcategoria (ou só com categoria, quando a edição não tem
 * subcategoria) não é sobrescrita.
 */
export function parcelaDoGrupoRecebeClassificacao(
    item: LinhaClassificacaoGrupo,
    editada: LinhaClassificacaoGrupo,
    classificacao: { categoria_id?: number | string | null; subcategoria_id?: number | string | null },
): boolean {
    if (item.id == null || editada.id == null || String(item.id) === String(editada.id)) return false
    if (editada.compra_grupo_id == null || String(editada.compra_grupo_id).trim() === '') return false
    if (String(item.compra_grupo_id ?? '') !== String(editada.compra_grupo_id)) return false
    if (!idVazio(classificacao.subcategoria_id)) return idVazio(item.subcategoria_id)
    if (!idVazio(classificacao.categoria_id)) return idVazio(item.categoria_id)
    return false
}

function fraseOutrasFaturas(
    pergunta: AplicarSubcategoriaPergunta,
    recebe: string,
    incluirNome: boolean,
): string {
    const nome = pergunta.estabelecimento_nome
    const deQuem = incluirNome && nome ? ` de ${nome}` : ' deste estabelecimento'
    const parcelas = pergunta.parcelas_outras_faturas
    if (parcelas === 1) {
        return `A compra${deQuem} na outra fatura, inclusive à vista, também recebe ${recebe}.`
    }
    return `As ${parcelas} compras${deQuem} nas outras faturas, inclusive à vista, também recebem ${recebe}.`
}

export function textoAplicarSubcategoria(pergunta: AplicarSubcategoriaPergunta): string {
    const nome = pergunta.estabelecimento_nome
    const deNome = nome ? ` de ${nome}` : ''
    const assunto = pergunta.somente_categoria ? 'categoria' : 'subcategoria'
    const recebe = pergunta.somente_categoria
        ? 'essa categoria'
        : 'essa categoria e subcategoria'
    const partes: string[] = []
    if (pergunta.linhas_nesta_fatura > 0) {
        const compras = pergunta.linhas_nesta_fatura === 1
            ? 'na outra compra'
            : `nas outras ${pergunta.linhas_nesta_fatura} compras`
        partes.push(`Aplicar a mesma ${assunto} ${compras}${deNome} nesta fatura?`)
    }
    if (pergunta.parcelas_outras_faturas > 0) {
        partes.push(fraseOutrasFaturas(pergunta, recebe, pergunta.linhas_nesta_fatura <= 0))
    }
    return partes.join(' ')
}

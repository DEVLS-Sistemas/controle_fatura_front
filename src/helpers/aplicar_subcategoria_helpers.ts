export type AplicarSubcategoriaPergunta = {
    perguntar: true
    estabelecimento_id: number | null
    estabelecimento_nome: string
    linhas_nesta_fatura: number
    parcelas_outras_faturas: number
    somente_categoria: boolean
}

function numero(value: unknown): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

export function parseAplicarSubcategoria(body: unknown): AplicarSubcategoriaPergunta | null {
    if (!body || typeof body !== 'object') return null
    const transacao = (body as { transacao?: unknown }).transacao
    if (!transacao || typeof transacao !== 'object') return null
    const raw = (transacao as { aplicar_subcategoria?: unknown }).aplicar_subcategoria
    if (!raw || typeof raw !== 'object') return null
    const obj = raw as Record<string, unknown>
    if (obj.perguntar !== true) return null
    const linhas = numero(obj.linhas_nesta_fatura)
    if (linhas <= 0) return null
    const estabelecimentoId = obj.estabelecimento_id == null || obj.estabelecimento_id === ''
        ? null
        : numero(obj.estabelecimento_id)
    return {
        perguntar: true,
        estabelecimento_id: estabelecimentoId,
        estabelecimento_nome: String(obj.estabelecimento_nome ?? '').trim(),
        linhas_nesta_fatura: linhas,
        parcelas_outras_faturas: numero(obj.parcelas_outras_faturas),
        somente_categoria: obj.somente_categoria === true,
    }
}

export function textoAplicarSubcategoria(pergunta: AplicarSubcategoriaPergunta): string {
    const nome = pergunta.estabelecimento_nome
    const deNome = nome ? ` de ${nome}` : ''
    const compras = pergunta.linhas_nesta_fatura === 1
        ? 'na outra compra'
        : `nas outras ${pergunta.linhas_nesta_fatura} compras`
    const assunto = pergunta.somente_categoria ? 'categoria' : 'subcategoria'
    let texto = `Aplicar a mesma ${assunto} ${compras}${deNome} nesta fatura?`
    const parcelas = pergunta.parcelas_outras_faturas
    const recebe = pergunta.somente_categoria
        ? 'essa categoria'
        : 'essa categoria e subcategoria'
    if (parcelas === 1) {
        texto += ` A parcela desta compra na outra fatura também recebe ${recebe}.`
    } else if (parcelas > 1) {
        texto += ` As ${parcelas} parcelas desta compra nas outras faturas também recebem ${recebe}.`
    }
    return texto
}

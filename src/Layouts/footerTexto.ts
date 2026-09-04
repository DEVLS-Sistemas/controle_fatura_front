export function textoRodape(ano: number, versao?: string | null): string {
    const base = `${ano} © Devls Sistemas`
    return versao ? `${base} · v${versao}` : base
}

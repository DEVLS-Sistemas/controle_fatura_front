export interface PerfilForm {
  name: string
  sobrenome: string
  cpf_cnpj: string
  email: string
}

export const PerfilDefaultValues: PerfilForm = {
  name: '',
  sobrenome: '',
  cpf_cnpj: '',
  email: '',
}

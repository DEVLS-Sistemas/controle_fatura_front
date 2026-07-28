// import { PaginateInterface } from "../default"

export interface UsuarioInterface {
    // listUsuarioPaginate(params: UsuarioSearch): Promise<PaginateInterface<UsuarioList> | undefined>
}


export interface UsuarioSearch {
    //Elementos Padroes para formulario
    input_text: string | null,    
    input_date: string | null,
    select_list: number | null | undefined,
    async_select_list: number | null | undefined,
    multiple_select_list: number | null | undefined,
    checkbox_a: boolean | null | undefined,
    checkbox_b: boolean | null | undefined,
    checkbox_c: boolean | null | undefined,
    switch_checkbox: boolean | null | undefined,
    radio: number | null,    

    palavra_chave: string | null | undefined | unknown
}

export interface UsuarioView {
    id?: number | undefined
}

export interface UsuarioList {
    id?: number | undefined
}

export interface UsuarioModel {
    id?: number | undefined | null,
    nome?: string | undefined | null,
    nascimento?: string | undefined | null,
    ativo?: boolean,
    sexo?: number,
}

export const UsuarioDefaultValues = {
    id: null,
    nome: '',
    nascimento: '',
    sexo:''
}



# Front End - Padrão de Criação de CRUD

## Rotas

Todo novo CRUD deverá possuir suas rotas cadastradas no arquivo:

`src/Routes/allRoutes.tsx`

### Exemplo

```tsx
// Cores
{ path: "/cores", component: <CoresPage /> },

{ path: "/cores/add", component: <CoresForm /> },

{ path: "/cores/edit/:idCor", component: <CoresForm /> },

Sidebar Menu

Todo CRUD deverá possuir um item de menu no arquivo:

src/Layouts/LayoutMenuData.tsx

Menu Único

{
    id: "Cores",
    label: "Cores",
    icon: "ri-palette-line",
    link: "/cores",
    click: function (e: any) {
        e.preventDefault();
        setIscurrentState('Cores');
        updateIconSidebar(e);
    }
},

Estrutura de Pastas

Toda funcionalidade deverá ser criada dentro de:

src/pages/Pages

Estrutura

src/pages/Pages/Cores/CoresPage.tsx

src/pages/Pages/Cores/CoresFilter/CoresFilter.tsx

src/pages/Pages/Cores/CoresForm/CoresForm.tsx

src/pages/Pages/Cores/CoresTable/CoresTable.tsx

Interfaces

Toda funcionalidade deverá possuir um arquivo de interface:

src/interfaces/Cores/CoresInterface.ts

Padrões obrigatórios
Lookups
Search
View
Model
defaultValues
Exemplo

export interface LookupsCores {

}

export interface CoresSearch {
    descricao?: string
    codigo?: string
}

export interface CoresView {
    id: number
    descricao: string
    codigo: string
    hexadecimal?: string
}

export interface CoresModel {
    id?: number
    descricao: string
    codigo: string
    hexadecimal?: string
}

export const defaultValues: CoresModel = {
    descricao: '',
    codigo: '',
    hexadecimal: ''
}

Services

Toda funcionalidade deverá possuir um arquivo service:

src/services/Cores/CoresService.ts

URL Base

this.url = 'cores'

Métodos obrigatórios
getViewCores
listCoresPaginate
AsyncListCores
createCores
editCores
deleteCores

Padrão da Tela de Listagem

Toda tela de listagem deverá possuir:

Filtros
Campo de busca
Botão de adicionar novo registro
Tabela paginada
Dropdown de ações
Ações obrigatórias
Visualizar
Editar
Excluir

Campos do CRUD
descricao
Tipo: string
Obrigatório: Sim
Máximo: 20 caracteres
codigo
Tipo: string
Obrigatório: Sim
hexadecimal
Tipo: string
Obrigatório: Não
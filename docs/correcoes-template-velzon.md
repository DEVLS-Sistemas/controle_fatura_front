# Correções do template Velzon

Ajustes de layout e bugs do shell (tabela, paginação, menu e marca) feitos neste front. O outro projeto usa o mesmo template: aplicar só esta lista. Telas de fatura, cartão e simulador ficam de fora.

Arquivos para copiar e adaptar:

- `src/Components/Common/TableActionsDropdown.tsx`
- `src/Components/Common/TablePagination.tsx`
- `src/Layouts/menuPath.ts`
- `src/Layouts/footerTexto.ts`

E alterar nos três layouts do menu, no `LayoutMenuData`, no `Footer` e no `ParticlesAuth`.

## 1. Dropdown no fim da linha da tabela

O menu de três pontos da última coluna some porque o `.table-responsive` corta o que sai da área da tabela. O `DropdownMenu` padrão do Reactstrap fica dentro desse bloco.

A correção renderiza o menu no `body`, com posição `fixed` e `z-index` acima do scroll.

```tsx
import React, { ReactNode } from "react"
import {
    ButtonGroup,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown,
} from "reactstrap"

type TableActionsDropdownProps = {
    children: ReactNode
    /** Classes do botão toggle. Default: "btn" */
    toggleClassName?: string
}

export const TableActionsDropdown = ({
    children,
    toggleClassName = "btn",
}: TableActionsDropdownProps) => (
    <ButtonGroup>
        <UncontrolledDropdown direction="down">
            <DropdownToggle tag="button" className={toggleClassName}>
                <i className="ri-more-2-fill"></i>
            </DropdownToggle>
            <DropdownMenu
                end
                strategy="fixed"
                container="body"
                style={{ zIndex: 1050 }}
            >
                {children}
            </DropdownMenu>
        </UncontrolledDropdown>
    </ButtonGroup>
)

export default TableActionsDropdown
```

Em cada tabela, trocar o `UncontrolledDropdown` manual por esse componente. O `zIndex: 999` antigo continua atrás do scroll. Para botão menor: `toggleClassName="btn btn-sm"`.

```tsx
<TableActionsDropdown>
  <Link to={`/recurso/edit/${row.id}`}>
    <DropdownItem>Editar</DropdownItem>
  </Link>
  <DropdownItem onClick={handleDelete}>Excluir</DropdownItem>
</TableActionsDropdown>
```

## 2. Paginação no mobile

A listagem usava só a coluna de desktop:

```tsx
<Col sm="12" className="d-none d-sm-flex ...">
```

`d-none d-sm-flex` esconde o bloco inteiro abaixo de 576px. No celular a paginação não existe.

O componente abaixo mantém o desktop e acrescenta um bloco só para mobile (`d-flex d-sm-none`): Anterior, o texto `Página X de Y` e Próximo, com os números da página embaixo e `flex-wrap`.

A paginação fica **fora** do `<div className="table-responsive">` da tabela.

No template antigo a `<ul>` da paginação ainda leva a classe `table-responsive` (neste repo, em `UsuarioTable`). Essa classe faz a lista rolar na horizontal e some no celular. Tirar `table-responsive` da `<ul>` e usar o componente.

```tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Col, Row } from 'reactstrap'

export type TablePaginationLink = {
    url: string | null
    label: string
    active: boolean
}

type TablePaginationProps = {
    currentPage: number
    lastPage: number
    links: TablePaginationLink[]
    onNavigate: (url: string | null) => void
    summary?: React.ReactNode
}

const TablePagination = ({
    currentPage,
    lastPage,
    links,
    onNavigate,
    summary,
}: TablePaginationProps) => {
    const prevUrl = links[0]?.url ?? null
    const nextUrl = links[links.length - 1]?.url ?? null
    const pageLinks = links.filter((_, index) => index !== 0 && index !== links.length - 1)

    const goTo = (event: React.MouseEvent, url: string | null) => {
        event.preventDefault()
        if (!url) return
        onNavigate(url)
    }

    const renderPrev = () => (
        <li className={currentPage === 1 ? 'page-item disabled' : 'page-item'}>
            <Link to="#" className="page-link" onClick={(event) => goTo(event, prevUrl)}>Anterior</Link>
        </li>
    )
    const renderNext = () => (
        <li className={currentPage === lastPage ? 'page-item disabled' : 'page-item'}>
            <Link to="#" className="page-link" onClick={(event) => goTo(event, nextUrl)}>Próximo</Link>
        </li>
    )
    const renderPages = () => pageLinks.map((item) => (
        <li key={item.label} className={`page-item ${item.active ? 'active' : ''}`}>
            <Link to="#" className="page-link" onClick={(event) => goTo(event, item.url)}>{item.label}</Link>
        </li>
    ))

    return (
        <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
            {summary != null && (
                <Col sm="12">
                    <div className="text-muted">{summary}</div>
                </Col>
            )}
            <Col sm="12" className="d-none d-sm-flex justify-content-end gap-2 flex-wrap">
                <ul className="pagination pagination-md mb-0">{renderPrev()}</ul>
                <ul className="pagination pagination-md mb-0 flex-wrap">{renderPages()}</ul>
                <ul className="pagination pagination-md mb-0">{renderNext()}</ul>
            </Col>
            <Col xs="12" className="d-flex d-sm-none flex-column align-items-center gap-2">
                <div className="d-flex align-items-center justify-content-center gap-2">
                    <ul className="pagination pagination-md mb-0">{renderPrev()}</ul>
                    <span className="text-muted small text-nowrap">
                        Página {currentPage} de {lastPage}
                    </span>
                    <ul className="pagination pagination-md mb-0">{renderNext()}</ul>
                </div>
                {pageLinks.length > 0 && (
                    <ul className="pagination pagination-sm mb-0 flex-wrap justify-content-center">
                        {renderPages()}
                    </ul>
                )}
            </Col>
        </Row>
    )
}

export default TablePagination
```

`links` segue o formato do Laravel: o primeiro item é Anterior, o último é Próximo, o meio são as páginas (`label`, `url`, `active`).

## 3. Item ativo do menu e do submenu

O Velzon marca o ativo só com `classList` no DOM e compara o caminho com igualdade exata. Ao navegar, o React redesenha o menu e apaga a classe. Rota filha (`/recurso/add`) não casa com `/recurso`. Vários grupos usavam o mesmo `id="sidebarApps"`, então o submenu errado abria. O `removeActivation` tirava a classe `show` do collapse a cada troca de rota, e o `iscurrentState` fechava os outros grupos.

### 3.1 `menuPath.ts`

```ts
export const pathIn = (path: string, prefixes: string[]) =>
    prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const isRealMenuPath = (pathname: string) =>
    Boolean(pathname) && pathname !== "/" && pathname !== "/#" && pathname !== "#";

export const findMatchingMenuItem = (anchors: ArrayLike<{ pathname: string }>, pathName: string) => {
    const items = Array.from(anchors);
    const exact = items.find((item) => item.pathname === pathName && isRealMenuPath(item.pathname));
    if (exact) return exact;

    return items
        .filter((item) => isRealMenuPath(item.pathname) && pathName.startsWith(`${item.pathname}/`))
        .sort((a, b) => b.pathname.length - a.pathname.length)[0];
};
```

`pathIn` casa a rota exata e as filhas. `/faturas-antigas` não casa com `/faturas`.

### 3.2 `LayoutMenuData`

Cada item e subitem ganha `isActive`. O grupo abre pelo próprio estado e permanece aberto na rota atual. Abrir um grupo deixa os outros como estão.

```tsx
const PREFIXOS = ["/rota-a", "/rota-b"];

const [isGrupo, setIsGrupo] = useState<boolean>(() => pathIn(path, PREFIXOS));
const isGrupoActive = pathIn(path, PREFIXOS);

useEffect(() => {
    if (isGrupoActive) setIsGrupo(true);
}, [path, isGrupoActive]);

// item de primeiro nível
{
    id: "recurso",
    label: "Recurso",
    link: "/recurso",
    isActive: pathIn(path, ["/recurso"]),
}

// grupo com submenu
{
    id: "grupo",
    label: "Grupo",
    link: "/#",
    isActive: isGrupoActive,
    stateVariables: isGrupo,
    click: function (e: any) {
        e.preventDefault();
        setIsGrupo((open) => !open);
    },
    subItems: [
        { id: "rota-a", label: "Rota A", link: "/rota-a", parentId: "grupo", isActive: pathIn(path, ["/rota-a"]) },
    ],
}
```

### 3.3 Os três layouts

Aplicar em `VerticalLayouts`, `HorizontalLayout` e `TwoColumnLayout`.

No `useEffect` que roda a cada mudança de rota:

```tsx
const pathName = (process.env.PUBLIC_URL || "") + path;
const ul = document.getElementById("navbar-nav") as HTMLElement;
if (!ul) return;
const itemsArray = [...ul.getElementsByTagName("a")];
removeActivation(itemsArray);
const matchingMenuItem = findMatchingMenuItem(itemsArray, pathName);
if (matchingMenuItem) {
    activateParentDropdown(matchingMenuItem);
}
```

`(process.env.PUBLIC_URL || "")` evita o caminho virar a string `"undefined/rota"`.

`removeActivation` só tira a classe `active`. Quem abre e fecha o submenu é o `isOpen` do `Collapse`:

```tsx
const removeActivation = (items: any) => {
    items.forEach((item: any) => {
        item.classList.remove("active");
    });
};
```

No JSX, a classe `active` vem do React, e cada `Collapse` tem o próprio id:

```tsx
<Link
    onClick={item.click}
    className={`nav-link menu-link${item.isActive ? " active" : ""}`}
    to={item.link ? item.link : "/#"}
    data-bs-toggle="collapse"
    aria-expanded={Boolean(item.stateVariables)}
>
    ...
</Link>
<Collapse className="menu-dropdown" isOpen={item.stateVariables} id={item.id}>
    ...
    <Link
        to={subItem.link ? subItem.link : "/#"}
        className={`nav-link${subItem.isActive ? " active" : ""}`}
    >
        {subItem.label}
    </Link>
</Collapse>
```

Item de primeiro nível sem submenu usa o mesmo `isActive` no `className` do `Link`.

## 4. Marca Velzon e versão

| Onde | Antes | Agora |
|---|---|---|
| `src/Layouts/Footer.tsx` | `{ano} © Velzon.` e “Design & Develop by Themesbrand” | `{ano} © Devls Sistemas · v{api_version}` |
| `src/pages/AuthenticationInner/ParticlesAuth.tsx` | `© {ano} Velzon. Crafted with ♥ by Themesbrand` | o mesmo texto do rodapé |
| `public/index.html` | título do template | título do sistema; favicon com `?v=2` |
| Logos | arquivos do Velzon | `logo-dark.png`, `logo-light.png`, `logo-sm.png` (sidebar) e `logo-colorido.png` (login) |

```ts
export function textoRodape(ano: number, versao?: string | null): string {
    const base = `${ano} © Devls Sistemas`
    return versao ? `${base} · v${versao}` : base
}
```

O `Footer` e o `ParticlesAuth` leem a versão uma vez ao montar. Se a chamada falha, o rodapé fica só com o ano e a marca.

```tsx
const [versao, setVersao] = useState<string | null>(null);
const ano = new Date().getFullYear();

useEffect(() => {
    let ativo = true;
    new VersaoService().obter()
        .then((dados) => { if (ativo) setVersao(dados.api_version); })
        .catch(() => { if (ativo) setVersao(null); });
    return () => { ativo = false; };
}, []);

// Footer, coluna única (a segunda coluna “Themesbrand” sai)
{textoRodape(ano, versao)}
```

Contrato da API, `GET` na raiz (`url: ''`, em geral `/api/v1`):

```ts
export interface VersaoApi {
    api_name: string
    api_version: string
    version_short: string
}
```

Arquivos de marca para substituir no outro projeto:

- `public/favicon.ico` e `src/assets/images/favicon.ico`
- `src/assets/images/logo-dark.png` (sidebar escura)
- `src/assets/images/logo-light.png` (sidebar clara)
- `src/assets/images/logo-sm.png` (sidebar recolhida)
- `src/assets/images/logo-colorido.png` (tela de login)
- `public/index.html`: `<title>` do sistema e `href="%PUBLIC_URL%/favicon.ico?v=2"`

Páginas de demonstração do template (login interno, widgets, dados fake) ainda têm “Velzon” e “Themesbrand”. O shell logado e o login real já usam a marca do sistema.

## 5. Outros ajustes do mesmo template

- **Fake backend.** Em `src/App.tsx`, o `fakeBackend()` do Velzon fica comentado. Ele interceptava XHR e misturava as chamadas da API real.
- **Overlay do webpack.** No `public/index.html`, o overlay de erro do dev server fica oculto:

```html
<style>
  #webpack-dev-server-client-overlay,
  iframe#webpack-dev-server-client-overlay {
    display: none !important;
  }
</style>
```

- **Submenus independentes.** O template original fechava todos os grupos ao abrir um. Cada grupo tem o próprio `useState`.

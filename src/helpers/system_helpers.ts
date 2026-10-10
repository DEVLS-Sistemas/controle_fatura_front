// Marca só o link da rota. O grupo (Relatórios, Recorrente, Cadastros)
// fica active pelo LayoutMenuData; tirar a classe aqui deixava o pai
// apagado ou, junto com o CSS de menu aberto, dois itens selecionados.
export function setActiveMenu(route: string) {
    const menuItems = document.querySelectorAll('#navbar-nav a');
    menuItems.forEach((menuItem) => {
        if (menuItem.getAttribute('data-bs-toggle') === 'collapse') {
            return;
        }
        const href = menuItem.getAttribute('href');
        if (href === route) {
            menuItem.classList.add('active');
        } else {
            menuItem.classList.remove('active');
        }
    });
}

  
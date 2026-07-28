// Responsavel por setar o menu lateral do sidebar
export function setActiveMenu(route: string) {
    const menuItems = document.querySelectorAll('#navbar-nav a');
    menuItems.forEach((menuItem) => {
        const href = menuItem.getAttribute('href');
        if (href === route) {
            setTimeout(() => {
                menuItem.classList.add('active');                
            }, 100);
            return false
      } else {
        menuItem.classList.remove('active');
      }
    });
  }
  
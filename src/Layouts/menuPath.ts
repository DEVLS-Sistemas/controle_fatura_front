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

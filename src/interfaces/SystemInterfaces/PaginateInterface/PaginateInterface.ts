export interface PaginateLinksInterface {
    url: string
    active: boolean
    label: string
}
export interface PerPageProps {
    value: number,
    label: string
}
export interface PaginateInterface<T> {
    data: T[];
    from: number;
    to: number;
    total: number
    links: PaginateLinksInterface[]
    current_page: number
    last_page: number
    per_page: number
    path: string
    first_page_url: string
    last_page_url: string
    next_page_url: string
    prev_page_url: string
}

export interface PaginateSearch {
    page?: number
    perPage?: number
}

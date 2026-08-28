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

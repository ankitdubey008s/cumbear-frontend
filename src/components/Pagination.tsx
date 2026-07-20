interface Props {
  currentPage: number
  totalPages?: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages = 10, onPageChange }: Props) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Prev
      </button>
      <div className="page-numbers">
        {pages.map(p => (
          <button
            key={p}
            className={`page-num ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        className="page-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next →
      </button>
    </div>
  )
}



type Props = {
  page: number;
  count: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, count, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(count / 25));

  const visiblePages = [...new Set([
    1,
    page - 1,
    page,
    page + 1,
    pages,
  ])]
    .filter((number) => number > 0 && number <= pages)
    .sort((a, b) => a - b);

  let description = '0 discussions';

  if (count > 0) {
    const start = (page - 1) * 25 + 1;
    const end = Math.min(page * 25, count);

    description = `${start}–${end} of ${count} discussions`;
  }

  return (
    <nav className="pagination" aria-label="Comment pages">
      <span className="muted">{description}</span>

      <div>
        <button
          type="button"
          className="page-button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>

        {visiblePages.map((number, index) => (
          <span key={number}>
            {index > 0 && number - visiblePages[index - 1] > 1 && (
              <span className="ellipsis">…</span>
            )}

            <button
              type="button"
              className={`page-button ${number === page ? 'active' : ''}`}
              aria-current={number === page ? 'page' : undefined}
              onClick={() => onChange(number)}
            >
              {number}
            </button>
          </span>
        ))}

        <button
          type="button"
          className="page-button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

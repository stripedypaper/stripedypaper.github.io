export function LineupGrid({ columns, cells, highlightColumn = null }) {
  return (
    <div
      className="lineup-grid"
      style={{ '--lineup-grid-columns': columns }}
      aria-hidden="true"
    >
      {cells.flatMap((row, rowIndex) =>
        row.map((cellColor, columnIndex) => (
          <span
            key={`${rowIndex}-${columnIndex}-${cellColor}`}
            className={`lineup-grid-cell${
              highlightColumn !== null && columnIndex !== highlightColumn
                ? ' lineup-grid-cell-muted'
                : ''
            }`}
            style={{ backgroundColor: cellColor }}
          />
        ))
      )}
    </div>
  );
}

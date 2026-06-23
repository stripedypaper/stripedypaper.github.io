function EmojiGrid({ columns, items, className = '' }) {
  return (
    <div
      className={`lineup-grid-emoji-grid${className ? ` ${className}` : ''}`}
      style={{ '--lineup-grid-columns': columns }}
    >
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="lineup-grid-emoji-cell">
          {item}
        </span>
      ))}
    </div>
  );
}

export function LineupGrid({
  imageUrl = '',
  imageAlt = '',
  columns,
  cells,
  highlightColumn = null,
  trailingEmojiGrid = null,
  trailingEmoji = ''
}) {
  return (
    <div className="lineup-grid-wrap" aria-hidden="true">
      {imageUrl ? (
        <img src={imageUrl} alt={imageAlt} className="lineup-grid-image" />
      ) : null}
      {cells?.length ? (
        <div
          className="lineup-grid"
          style={{ '--lineup-grid-columns': columns }}
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
      ) : null}
      {trailingEmojiGrid?.items?.length ? (
        <EmojiGrid
          columns={trailingEmojiGrid.columns}
          items={trailingEmojiGrid.items}
        />
      ) : null}
      {trailingEmoji ? (
        <span className="lineup-grid-emoji-single">{trailingEmoji}</span>
      ) : null}
    </div>
  );
}

// Stands in for DetailScreen/ExceptionDetailScreen while a manually
// triggered refetch is in flight (see InvoiceDetailPage's manualRefreshing) -
// mirrors their infobar + panels layout so the page doesn't jump around
// when the real content swaps back in.
const INFOBAR_FIELDS = 8

export default function DetailScreenSkeleton() {
  return (
    <div id="detailScreen">
      <div className="infobar">
        {Array.from({ length: INFOBAR_FIELDS }).map((_, i) => (
          <div className="info-field" key={i}>
            <div className="shimmer-block" style={{ height: '10px', width: '50%', marginBottom: '8px' }} />
            <div className="shimmer-block" style={{ height: '14px', width: '75%' }} />
          </div>
        ))}
      </div>

      <div className="panels">
        <div className="shimmer-block" style={{ minHeight: '480px' }} />
        <div className="shimmer-block" style={{ minHeight: '480px' }} />
      </div>
    </div>
  )
}

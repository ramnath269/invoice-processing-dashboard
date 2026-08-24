import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/icons'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const DEFAULT_PDF_URL = '/ABC_corp_invoice.pdf'
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.2
const MAX_FIT_WIDTH = 760

export default function DocumentViewer({ fileUrl }) {
  const documentSource = fileUrl || DEFAULT_PDF_URL
  const [numPages, setNumPages] = useState(1)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [containerWidth, setContainerWidth] = useState(300)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const docBodyRef = useRef(null)
  const docPanelRef = useRef(null)

  useEffect(() => {
    const el = docBodyRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === docPanelRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  function handleLoadSuccess({ numPages: loadedPages }) {
    setNumPages(loadedPages)
    setPageNumber(1)
  }

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))
  }
  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else if (docPanelRef.current?.requestFullscreen) {
      docPanelRef.current.requestFullscreen()
    }
  }

  const fitWidth = Math.min(containerWidth - 4, MAX_FIT_WIDTH)
  const pageWidth = Math.max(120, fitWidth) * zoom

  return (
    <div className="doc-panel" ref={docPanelRef}>
      <div className="doc-toolbar">
        <div className="zoom">
          <button className="icon-btn" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} title="Zoom out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3M8 11h6" />
            </svg>
          </button>
          {Math.round(zoom * 100)}%
          <button className="icon-btn" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} title="Zoom in">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
            </svg>
          </button>
        </div>
        <button className="icon-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit full screen' : 'Full screen'}>
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 3H5a2 2 0 00-2 2v4M15 3h4a2 2 0 012 2v4M9 21H5a2 2 0 01-2-2v-4M15 21h4a2 2 0 002-2v-4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          )}
        </button>
        <button className="icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </button>
        <button className="icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
          </svg>
        </button>
        <button className="icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>
      <div className="doc-body" ref={docBodyRef}>
        <Document
          file={documentSource}
          onLoadSuccess={handleLoadSuccess}
          loading={<div className="page-note">Loading document…</div>}
          error={<div className="page-note">Failed to load document.</div>}
        >
          <div className="doc-page-wrap" style={{ width: pageWidth }}>
            <Page pageNumber={pageNumber} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
          </div>
        </Document>
      </div>
      <div className="doc-thumbs">
        <button
          className="icon-btn"
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          title="Previous page"
        >
          <ChevronLeftIcon />
        </button>
        <div className="thumb-strip">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`thumb${n === pageNumber ? ' active' : ''}`}
              title={`Page ${n}`}
              onClick={() => setPageNumber(n)}
            >
              {n}
            </div>
          ))}
        </div>
        <div className="pageinfo">{pageNumber} of {numPages}</div>
        <button
          className="icon-btn"
          onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          disabled={pageNumber >= numPages}
          title="Next page"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  )
}

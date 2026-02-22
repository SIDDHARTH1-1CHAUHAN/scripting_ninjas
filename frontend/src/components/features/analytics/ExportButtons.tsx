'use client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'

interface ExportRow {
  hsCode: string
  count: number
  confidence: number
  savings: number
}

export function ExportButtons({ data, chartRef }: { data: ExportRow[]; chartRef?: React.RefObject<HTMLDivElement> }) {
  const exportPDF = async () => {
    const pdf = new jsPDF()

    pdf.setFontSize(20)
    pdf.text('TradeOptimize AI - Analytics Report', 14, 22)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)

    autoTable(pdf, {
      head: [['HS Code', 'Classifications', 'Avg Confidence', 'Savings']],
      body: data.map((d) => [d.hsCode, d.count, `${d.confidence}%`, `$${d.savings}`]),
      startY: 40,
    })

    if (chartRef?.current) {
      const canvas = await html2canvas(chartRef.current)
      const imgData = canvas.toDataURL('image/png')
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 100)
    }

    pdf.save('tradeoptimize-report.pdf')
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), 'tradeoptimize-report.xlsx')
  }

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    saveAs(new Blob([csv], { type: 'text/csv' }), 'tradeoptimize-report.csv')
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportPDF}
        className="border border-dark px-3 py-2 text-xs font-pixel hover:bg-dark hover:text-canvas bg-panel/60 shadow-[var(--surface-shadow)]"
      >
        EXPORT_PDF
      </button>
      <button
        onClick={exportExcel}
        className="border border-dark px-3 py-2 text-xs font-pixel hover:bg-dark hover:text-canvas bg-panel/60 shadow-[var(--surface-shadow)]"
      >
        EXPORT_XLSX
      </button>
      <button
        onClick={exportCSV}
        className="border border-dark px-3 py-2 text-xs font-pixel hover:bg-dark hover:text-canvas bg-panel/60 shadow-[var(--surface-shadow)]"
      >
        EXPORT_CSV
      </button>
    </div>
  )
}

'use client'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ChatContainer } from '@/components/features/assistant/ChatContainer'

export default function AssistantPage() {
  const rightPanelContent = (
    <div className="space-y-5 text-sm">
      <section className="border border-dark/55 bg-canvas/5 p-4 space-y-3">
        <div className="label">CAPABILITIES</div>
        <ul className="space-y-2 text-text-inv/90">
          <li>• HS code classification</li>
          <li>• Duty and tariff estimation</li>
          <li>• Compliance checklist guidance</li>
          <li>• Document requirement planning</li>
          <li>• Route and shipment decision support</li>
        </ul>
      </section>
      <section className="border border-dark/55 bg-canvas/5 p-4 space-y-3">
        <div className="label">KEYBOARD SHORTCUTS</div>
        <div className="space-y-2 text-text-inv/90">
          <div><kbd className="font-pixel text-xs border border-dark/50 px-1.5 py-0.5">Ctrl+K</kbd> Open assistant</div>
          <div><kbd className="font-pixel text-xs border border-dark/50 px-1.5 py-0.5">Ctrl+Shift+C</kbd> Open classify</div>
          <div><kbd className="font-pixel text-xs border border-dark/50 px-1.5 py-0.5">Ctrl+Shift+L</kbd> Open landed cost</div>
        </div>
      </section>
      <section className="border border-dark/55 bg-canvas/5 p-4 space-y-2">
        <div className="label">AI ENGINE</div>
        <div className="font-pixel text-sm">GROQ + FALLBACK</div>
        <div className="text-xs text-text-inv/70">Current provider/model is shown live above the chat.</div>
      </section>
      <section className="border border-dark/55 bg-canvas/5 p-4 space-y-2">
        <div className="label">BEST INPUT FORMAT</div>
        <div className="text-xs text-text-inv/80 leading-relaxed">
          Include product name, material, use-case, origin country, and shipment value for more actionable output.
        </div>
      </section>
    </div>
  )

  return (
    <AppLayout rightPanel={rightPanelContent}>
      <WorkspaceHeader
        title="AI"
        pixelTitle="ASSISTANT"
        metaLabel="MODEL"
        metaValue="DYNAMIC"
      />
      <ChatContainer />
    </AppLayout>
  )
}

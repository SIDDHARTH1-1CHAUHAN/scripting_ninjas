'use client'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ChatContainer } from '@/components/features/assistant/ChatContainer'

export default function AssistantPage() {
  const rightPanelContent = (
    <div className="space-y-6">
      <div>
        <div className="label text-[#888] mb-2">CAPABILITIES</div>
        <ul className="text-sm space-y-2">
          <li>• HS Code Classification</li>
          <li>• Tariff Rate Lookup</li>
          <li>• Trade Compliance Check</li>
          <li>• Document Requirements</li>
          <li>• Route Optimization</li>
        </ul>
      </div>
      <div>
        <div className="label text-[#888] mb-2">KEYBOARD_SHORTCUTS</div>
        <div className="text-sm space-y-1">
          <div><kbd className="font-pixel text-xs">Ctrl+K</kbd> Open Assistant</div>
          <div><kbd className="font-pixel text-xs">Ctrl+Shift+C</kbd> Classify</div>
          <div><kbd className="font-pixel text-xs">Ctrl+Shift+L</kbd> Landed Cost</div>
        </div>
      </div>
      <div>
        <div className="label text-[#888] mb-2">AI_MODEL</div>
        <div className="font-pixel text-sm">GROQ_LLAMA_3.1_70B</div>
        <div className="text-xs text-[#666] mt-1">800 tokens/sec</div>
      </div>
    </div>
  )

  return (
    <AppLayout rightPanel={rightPanelContent}>
      <WorkspaceHeader
        title="AI"
        pixelTitle="ASSISTANT"
        metaLabel="MODEL"
        metaValue="LLAMA_3.1"
      />
      <ChatContainer />
    </AppLayout>
  )
}

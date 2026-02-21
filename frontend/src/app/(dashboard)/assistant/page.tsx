import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'

export default function AssistantPage() {
  return (
    <AppLayout>
      <WorkspaceHeader
        title="AI"
        pixelTitle="ASSISTANT"
        metaLabel="STATUS"
        metaValue="PHASE_2"
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="font-pixel text-2xl mb-2">COMING_SOON</div>
          <p className="text-sm opacity-60">This feature will be implemented in Phase 2</p>
        </div>
      </div>
    </AppLayout>
  )
}

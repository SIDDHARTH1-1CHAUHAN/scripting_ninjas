import { useMutation } from '@tanstack/react-query'
import { checkCompliance, type ComplianceRequest } from '@/lib/api'

export function useCompliance() {
  return useMutation({
    mutationFn: (params: ComplianceRequest) => checkCompliance(params),
  })
}

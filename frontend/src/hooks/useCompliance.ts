import { useMutation } from '@tanstack/react-query'
import { checkCompliance } from '@/lib/api'

interface ComplianceParams {
  hs_code: string
  origin_country: string
  destination_country: string
  supplier_name?: string
}

export function useCompliance() {
  return useMutation({
    mutationFn: (params: ComplianceParams) => checkCompliance(params),
  })
}

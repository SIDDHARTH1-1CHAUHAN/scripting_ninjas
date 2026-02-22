import { useMutation } from '@tanstack/react-query'
import { calculateLandedCost, type LandedCostRequest } from '@/lib/api'

export function useLandedCost() {
  return useMutation({
    mutationFn: (params: LandedCostRequest) => calculateLandedCost(params),
  })
}

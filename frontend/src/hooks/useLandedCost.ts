import { useMutation } from '@tanstack/react-query'
import { calculateLandedCost } from '@/lib/api'

interface LandedCostParams {
  hs_code: string
  product_value: number
  quantity: number
  origin_country: string
  destination_country: string
  shipping_mode: string
}

export function useLandedCost() {
  return useMutation({
    mutationFn: (params: LandedCostParams) => calculateLandedCost(params),
  })
}

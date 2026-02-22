import { useMutation } from '@tanstack/react-query'
import { getForexForecast, type ForexForecastRequest } from '@/lib/api'

export function useForexForecast() {
  return useMutation({
    mutationFn: (params: ForexForecastRequest) => getForexForecast(params),
  })
}

import { useMutation } from '@tanstack/react-query'
import { classifyProduct, classifyFromImage } from '@/lib/api'

export function useClassification() {
  return useMutation({
    mutationFn: (description: string) => classifyProduct(description),
  })
}

export function useImageClassification() {
  return useMutation({
    mutationFn: ({ image, context }: { image: File; context?: string }) =>
      classifyFromImage(image, context),
  })
}

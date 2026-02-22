import { useMutation } from '@tanstack/react-query'
import { classifyProduct, classifyFromImage } from '@/lib/api'

export function useClassification() {
  return useMutation({
    mutationFn: ({ description, context }: { description: string; context?: string }) =>
      classifyProduct(description, context),
  })
}

export function useImageClassification() {
  return useMutation({
    mutationFn: ({ image, context }: { image: File; context?: string }) =>
      classifyFromImage(image, context),
  })
}

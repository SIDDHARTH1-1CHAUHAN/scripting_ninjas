declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: string
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              width?: number
            },
          ) => void
        }
      }
    }
  }
}

export {}


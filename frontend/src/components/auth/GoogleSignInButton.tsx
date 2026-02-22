'use client'

import { useEffect, useRef } from 'react'

interface Props {
  onCredential: (idToken: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
}

const SCRIPT_ID = 'google-identity-services-script'

export function GoogleSignInButton({ onCredential, text = 'continue_with' }: Props) {
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

  useEffect(() => {
    if (!clientId || !buttonRef.current) {
      return
    }

    const mountButton = () => {
      if (!window.google || !buttonRef.current) {
        return
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential)
          }
        },
      })

      buttonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        width: 320,
      })
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      if (window.google) {
        mountButton()
      } else {
        existingScript.addEventListener('load', mountButton, { once: true })
      }
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = mountButton
    document.body.appendChild(script)
  }, [clientId, onCredential, text])

  if (!clientId) {
    return (
      <div className="border border-dark/60 bg-canvas/60 p-3 text-xs opacity-80">
        Google sign-in is not configured in this environment. Use Demo Mode below.
      </div>
    )
  }

  return <div ref={buttonRef} className="min-h-[44px]" />
}

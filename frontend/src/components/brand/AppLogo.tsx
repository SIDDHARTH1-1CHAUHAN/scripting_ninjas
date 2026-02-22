import Image from 'next/image'

interface AppLogoProps {
  size?: 'sm' | 'md'
  showWordmark?: boolean
}

export function AppLogo({ size = 'md', showWordmark = true }: AppLogoProps) {
  const iconSize = size === 'sm' ? 36 : 48

  return (
    <div className="flex items-center gap-3">
      <Image
        src="/tradeopt-logo.svg"
        alt="TradeOptimize logo"
        width={iconSize}
        height={iconSize}
        className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-primary-bg)] shadow-[0_10px_24px_rgba(42,35,68,0.16)]"
      />
      {showWordmark && (
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-[0.03em] text-[var(--landing-ink)]">TRADEOPTIMIZE</div>
          <div className="text-[10.5px] tracking-[0.14em] text-[var(--landing-muted)]">AI CONTROL TOWER</div>
        </div>
      )}
    </div>
  )
}

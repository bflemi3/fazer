import { cn } from '@/lib/utils'

type ListCardProps = React.ComponentProps<'div'>

export function ListCard({ className, onClick, ...props }: ListCardProps) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
    onClick?.(e)
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 bg-white px-4 py-2.5 transition-all duration-150 hover:bg-zinc-50 active:scale-[0.98] active:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:active:bg-zinc-700',
        className,
      )}
      onClick={handleClick}
      {...props}
    />
  )
}

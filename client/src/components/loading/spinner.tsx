import { cn } from "@/lib/utils"

type Props = {
  color?: string
  className?: string
}

export default function Spinner({ color = "white", className }: Props) {

  return (
    <div 
      className={cn("w-4 h-4 border-2 rounded-full animate-spin", className)} 
      style={{ 
        borderColor: color,
        borderTopColor: "transparent"
      }}
    />
  )
}
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "light" | "medium" | "heavy"
  border?: "none" | "subtle" | "prominent"
  shadow?: "none" | "sm" | "md" | "lg" | "xl"
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "full"
  hover?: boolean
  glow?: "none" | "magenta" | "cyan" | "both"
}

const intensityClasses = {
  light: "glass-light",
  medium: "glass-medium",
  heavy: "glass-heavy",
}

const borderClasses = {
  none: "border-0",
  subtle: "",
  prominent: "border border-white/20",
}

const shadowClasses = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
}

const radiusClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
}

const glowClasses = {
  none: "",
  magenta: "glow-magenta",
  cyan: "glow-cyan",
  both: "glow-both",
}

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  (
    {
      className,
      intensity = "medium",
      border = "subtle",
      shadow = "md",
      radius = "lg",
      hover = true,
      glow = "none",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative",
          intensityClasses[intensity],
          borderClasses[border],
          shadowClasses[shadow],
          radiusClasses[radius],
          hover && "hover-lift",
          glow !== "none" && glowClasses[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassSurface.displayName = "GlassSurface"

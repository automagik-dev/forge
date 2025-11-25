import * as React from "react"
import { cn } from "@/lib/utils"

export interface TypographyProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export function H1({ className, children, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        "font-primary text-4xl font-bold tracking-tight",
        "scroll-m-20",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

export function H2({ className, children, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        "font-primary text-3xl font-semibold tracking-tight",
        "scroll-m-20",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

export function H3({ className, children, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        "font-primary text-2xl font-semibold tracking-tight",
        "scroll-m-20",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function H4({ className, children, ...props }: TypographyProps) {
  return (
    <h4
      className={cn(
        "font-primary text-xl font-semibold tracking-tight",
        "scroll-m-20",
        className
      )}
      {...props}
    >
      {children}
    </h4>
  )
}

/** @public - Design system typography component */
export function H5({ className, children, ...props }: TypographyProps) {
  return (
    <h5
      className={cn(
        "font-primary text-lg font-medium tracking-tight",
        "scroll-m-20",
        className
      )}
      {...props}
    >
      {children}
    </h5>
  )
}

/** @public - Design system typography component */
export function H6({ className, children, ...props }: TypographyProps) {
  return (
    <h6
      className={cn(
        "font-primary text-base font-medium tracking-tight",
        "scroll-m-20",
        className
      )}
      {...props}
    >
      {children}
    </h6>
  )
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "border-transparent bg-text text-black hover:bg-white focus-visible:outline-accent disabled:opacity-50",
  ghost:
    "border-border-strong bg-transparent text-text hover:border-accent hover:bg-accent-soft focus-visible:outline-accent disabled:opacity-50",
  link: "border-transparent bg-transparent px-0 text-text hover:text-accent focus-visible:outline-accent disabled:opacity-50",
};

const sizes = {
  md: "min-h-11 px-6 text-sm",
  lg: "min-h-14 px-8 text-base",
};

type ButtonProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  href?: string;
  trailing?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      href,
      trailing,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-3 rounded-full border font-medium leading-none transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      variants[variant],
      variant === "link" ? "min-h-0" : sizes[size],
      className,
    );

    const content = (
      <>
        <span>{children}</span>
        {trailing ??
          (variant === "link" ? (
            <ArrowRight aria-hidden className="size-4" />
          ) : null)}
      </>
    );

    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...props}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        type={type}
        {...props}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";

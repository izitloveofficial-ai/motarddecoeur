import type { SVGProps } from "react";

export function HeartFilledIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 150 100" fill="#c81e1e" stroke="none" aria-hidden="true" {...props}>
      <path
        d="M90 108 C40 72, 34 40, 52 24 C68 10, 90 22, 90 42 C90 22, 112 10, 128 24 C146 40, 140 72, 90 108 Z"
        transform="translate(-30,-20)"
      />
    </svg>
  );
}

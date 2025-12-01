import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export function MenuToggleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M3 12h13" />
        <path d="M3 6h18" />
        <path d="M3 18h7" />
        <path d="m18 15-3-3 3-3" />
    </svg>
  );
}

export function MbPosLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      >
      <text x="10" y="85" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold" fill="currentColor">
        POS
      </text>
      
      <path d="M 50,70 L 50,45 L 60,35 L 70,45 L 70,70 L 60,60 Z" fill="currentColor" />
      <path d="M 70,70 L 70,45 L 80,35 L 90,45 L 90,70 L 80,60 Z" fill="currentColor" />
      
      <path d="M 100,50 
               A 20 20, 0, 0, 1, 100 10
               L 120,10 
               A 40 40, 0, 0, 0, 120 90
               L 100,90
               A 20 20, 0, 0, 1, 100 50
               Z" fill="currentColor" />
       <path d="M 100,50 
               A 10 10, 0, 1, 0, 100 30
               A 10 10, 0, 1, 0, 100 50
               Z" fill="white" />
       <path d="M 100,50 
               A 10 10, 0, 1, 1, 100 70
               A 10 10, 0, 1, 1, 100 50
               Z" fill="white" />
        <path d="M 90 20 L 150 20" stroke="currentColor" strokeWidth="4" />
        <path d="M 95 25 L 155 25" stroke="currentColor" strokeWidth="4" />
        <path d="M 100 30 L 160 30" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

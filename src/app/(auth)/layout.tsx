import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <Image
        src="https://placehold.co/1920x1080.png"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 z-0 opacity-20"
        data-ai-hint="inventory warehouse"
      />
      <div className="relative z-10 w-full max-w-md p-4">{children}</div>
    </div>
  );
}

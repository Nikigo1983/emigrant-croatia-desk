import Image from "next/image";

type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`relative h-12 w-44 ${className}`}>
      <Image
        src="/logo.png"
        alt="Emigrant"
        fill
        className="object-contain object-left"
        sizes="176px"
        priority
      />
    </div>
  );
}

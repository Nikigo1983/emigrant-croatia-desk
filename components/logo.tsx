import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
  /** Если задан — логотип ведёт на главную раздела (кабинет / админка). */
  href?: string;
};

export function Logo({ className = "", href }: LogoProps) {
  const image = (
    <Image
      src="/logo.png"
      alt="Emigrant"
      fill
      className="object-contain object-left"
        sizes="48px"
      priority
    />
  );

  const boxClass = `relative block h-12 w-12 ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={`${boxClass} rounded-lg transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]`}
        aria-label="На главную"
      >
        {image}
      </Link>
    );
  }

  return <div className={boxClass}>{image}</div>;
}

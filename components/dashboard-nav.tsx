"use client";

import { usePathname } from "next/navigation";
import { BurgerNav } from "@/components/burger-nav";

export function DashboardNav() {
  const pathname = usePathname() ?? "";

  return (
    <BurgerNav
      menuButtonLabel="Меню кабинета"
      ariaLabel="Разделы личного кабинета"
      sections={[
        {
          items: [
            {
              href: "/dashboard",
              label: "Статус вашего процесса сейчас",
              active: pathname === "/dashboard",
            },
            { href: "/dashboard/faq", label: "FAQ", active: pathname === "/dashboard/faq" },
            {
              href: "/dashboard/instructions",
              label: "Инструкции",
              active: pathname === "/dashboard/instructions",
            },
          ],
        },
      ]}
    />
  );
}

"use client";

import { usePathname } from "next/navigation";
import { BurgerNav } from "@/components/burger-nav";

export function AdminNav() {
  const pathname = usePathname() ?? "";

  const isHome = pathname === "/admin";
  const isNewClient = pathname === "/admin/clients/new";
  const isAdminsList = pathname === "/admin/admins";
  const isCreateAdmin = pathname === "/admin/create-admin";
  const isClientsList = pathname === "/admin/clients";
  const isClientDetail =
    pathname.startsWith("/admin/clients/") && !isNewClient && !isClientsList;
  const clientsNavActive = isClientsList || isClientDetail;

  return (
    <BurgerNav
      menuButtonLabel="Меню админки"
      ariaLabel="Навигация админки"
      sections={[
        {
          items: [
            { href: "/admin", label: "Главная", active: isHome },
            { href: "/admin/clients", label: "Клиенты", active: clientsNavActive },
            { href: "/admin/admins", label: "Администраторы", active: isAdminsList },
          ],
        },
        {
          title: "Действия",
          items: [
            { href: "/admin/clients/new", label: "Новый клиент", active: isNewClient },
            {
              href: "/admin/create-admin",
              label: "Новый администратор",
              active: isCreateAdmin,
            },
          ],
        },
      ]}
    />
  );
}

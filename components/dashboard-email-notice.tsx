type Props = {
  email: string;
};

export function DashboardEmailNotice({ email }: Props) {
  return (
    <section
      className="rounded-xl border border-sky-200 bg-sky-50/80 p-5 text-sky-950 shadow-sm"
      aria-labelledby="dashboard-email-notice-title"
    >
      <h2 id="dashboard-email-notice-title" className="text-base font-semibold text-sky-950">
        Уведомления на email
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-sky-900/95">
        <p>
          При каждом изменении статуса вашего дела мы отправляем письмо на{" "}
          <span className="font-medium text-sky-950">{email}</span>. Следите за почтой — так вы
          не пропустите важные обновления, даже если не заходите в кабинет каждый день.
        </p>
        <p>
          Письма от <span className="font-medium text-sky-950">Emigrant Croatia Desk</span> иногда
          попадают в папку «Спам» или «Нежелательное» — это чаще заметно уже со второго письма и
          далее. Периодически заглядывайте в эти папки.
        </p>
        <p>
          Если письмо от Emigrant оказалось в спаме: откройте его и нажмите{" "}
          <span className="font-medium text-sky-950">«Не спам»</span> (или аналог в вашем
          почтовом сервисе). Тогда следующие уведомления с большей вероятностью будут приходить
          во входящие.
        </p>
      </div>
    </section>
  );
}

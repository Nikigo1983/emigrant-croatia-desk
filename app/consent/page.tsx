import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных | Emigrant Croatia Desk",
};

export default function ConsentPage() {
  return (
    <LegalPageLayout title="Согласие на обработку персональных данных">
      <p>
        Пользователь предоставляет согласие на обработку персональных данных, включая:
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>имя</li>
        <li>email</li>
        <li>сведения, связанные с иммиграционным делом</li>
        <li>данные, переданные через личный кабинет</li>
      </ul>

      <p>Обработка данных включает:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>хранение</li>
        <li>систематизацию</li>
        <li>обновление</li>
        <li>использование</li>
        <li>удаление</li>
      </ul>

      <p>
        Обработка осуществляется исключительно в целях предоставления услуг Emigrant Croatia
        Desk.
      </p>

      <p>
        Пользователь имеет право запросить удаление или изменение своих персональных данных.
      </p>

      <p>Согласие действует с момента начала использования сервиса.</p>
    </LegalPageLayout>
  );
}

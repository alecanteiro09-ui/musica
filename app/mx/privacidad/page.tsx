export const metadata = { title: "Aviso de Privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs uppercase tracking-wide text-accent">aviso de privacidad</p>
      <h1 className="mt-2 font-display text-3xl italic text-ink">Aviso de Privacidad</h1>
      <p className="mt-2 text-sm text-ink-muted">Última actualización: septiembre de 2026.</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-muted">
        <Section title="1. Quién trata tus datos">
          <p>
            <strong className="text-ink">LVC DIGITAL LTDA</strong>, operadora de Verso Único, es la responsable
            del tratamiento de los datos personales recabados a través de este sitio, conforme a la Ley Federal
            de Protección de Datos Personales en Posesión de los Particulares.
          </p>
        </Section>

        <Section title="2. Qué datos recabamos">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Nombre y correo de quien compra.</li>
            <li>
              La historia, el apodo, la relación y los detalles que escribes (o dictas por voz) sobre la persona
              homenajeada — usados para generar la letra de la canción.
            </li>
            <li>Fotos, si eliges incluirlas en la página-regalo o en el cuadro en PDF.</li>
            <li>
              Grabación de tu voz, solo si eliges la clonación de voz — usada exclusivamente para entrenar el
              modelo que canta la canción con esa voz.
            </li>
            <li>
              Datos de pago (los necesarios para procesar tu tarjeta) — procesados directamente por Stripe;
              nosotros no almacenamos el número de tu tarjeta.
            </li>
          </ul>
        </Section>

        <Section title="3. Para qué tratamos estos datos">
          <p>
            Para generar y entregar la canción y el regalo que compraste, procesar el pago, enviar el correo de
            confirmación, y responder tu contacto cuando necesites soporte. La base es la ejecución del contrato
            (la compra que hiciste) y, en el caso de la foto y la voz, tu consentimiento expreso al elegir esos
            complementos.
          </p>
        </Section>

        <Section title="4. Con quién compartimos">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-ink">Stripe</strong> — procesamiento del pago con tarjeta.
            </li>
            <li>
              <strong className="text-ink">Proveedores de IA</strong> (Anthropic, y un proveedor de generación
              musical/voz/imagen vía Kie.ai) — reciben el texto de la historia, y, cuando aplica, la foto o la
              grabación de voz, exclusivamente para generar la letra, la canción, la clonación de voz o el
              retoque de la foto de tu pedido.
            </li>
            <li>
              <strong className="text-ink">Supabase</strong> — almacenamiento del pedido, las pistas de audio y
              las fotos.
            </li>
            <li>
              <strong className="text-ink">Resend</strong> — envío del correo de confirmación.
            </li>
            <li>
              <strong className="text-ink">Meta (Facebook/Instagram), TikTok y Google Ads</strong> — medición
              del desempeño de nuestros anuncios. Reciben solo datos técnicos de la visita (como dirección IP e
              identificadores de anuncio) y, cuando compras, tu correo y teléfono de forma cifrada (hash), que
              estas empresas no pueden revertir al dato original — usados solo para saber si un anuncio resultó
              en una compra, nunca para identificarte en otro contexto.
            </li>
          </ul>
          <p className="mt-2">No vendemos ni rentamos tus datos a nadie.</p>
        </Section>

        <Section title="5. Por cuánto tiempo los guardamos">
          <p>
            Guardamos los datos de tu pedido mientras la página-regalo esté activa, para que el enlace siga
            funcionando. La grabación de voz usada para la clonación se envía a un almacenamiento privado y no
            queda expuesta públicamente. Puedes pedir la eliminación de tus datos en cualquier momento — ver
            sección 7.
          </p>
        </Section>

        <Section title="6. Seguridad">
          <p>
            Los datos están en una base con control de acceso restringido (ninguna tabla se lee públicamente sin
            pasar por el código del servidor), y el acceso al pedido se hace mediante un enlace/token privado,
            no por inicio de sesión público. Las pistas de audio y la grabación de voz quedan en almacenamiento
            privado, con URLs temporales generadas solo al momento de usarse.
          </p>
        </Section>

        <Section title="7. Tus derechos ARCO">
          <p>
            Puedes, en cualquier momento, solicitar el acceso, rectificación, cancelación u oposición
            (derechos ARCO) sobre tus datos, o revocar un consentimiento otorgado (por ejemplo, pedir la
            eliminación de la foto o la grabación de voz enviadas). Solo escribe a{" "}
            <a href="mailto:contato@versounicogift.online" className="text-accent underline">
              contato@versounicogift.online
            </a>
            .
          </p>
        </Section>

        <Section title="8. Cookies y píxeles de anuncio">
          <p>
            Además de lo mínimo necesario para que el sitio funcione, usamos los píxeles de medición de Meta,
            TikTok y Google Ads para entender si nuestros anuncios están funcionando (por ejemplo, si alguien
            que hizo clic en un anuncio después compró una canción). Esto registra cookies propias de esas
            empresas en tu navegador. Puedes bloquear estas cookies en la configuración de tu navegador en
            cualquier momento, sin que esto afecte la compra o la entrega de tu canción.
          </p>
        </Section>

        <Section title="9. Cambios en este aviso">
          <p>Podemos actualizar este aviso conforme el servicio evoluciona. La versión vigente es siempre la publicada en esta página.</p>
        </Section>

        <Section title="10. Contacto">
          <p>
            Dudas sobre tus datos o este aviso:{" "}
            <a href="mailto:contato@versounicogift.online" className="text-accent underline">
              contato@versounicogift.online
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg italic text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

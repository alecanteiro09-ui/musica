import Link from "next/link";

export const metadata = { title: "Términos de Uso" };

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs uppercase tracking-wide text-accent">términos de uso</p>
      <h1 className="mt-2 font-display text-3xl italic text-ink">Términos de Uso</h1>
      <p className="mt-2 text-sm text-ink-muted">Última actualización: septiembre de 2026.</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-muted">
        <Section title="1. Quiénes somos">
          <p>
            Verso Único es operado por <strong className="text-ink">LVC DIGITAL LTDA</strong>. Al crear un pedido
            en el sitio, aceptas estos términos.
          </p>
        </Section>

        <Section title="2. Qué vendemos">
          <p>
            Una canción original, compuesta y cantada por inteligencia artificial a partir de la historia que
            cuentas sobre alguien. Recibes: la letra completa, la canción cantada, una página-regalo (enlace y
            código QR) con fotos y la letra encendiéndose en karaoke, y el archivo MP3 para descargar.
            Opcionalmente puedes agregar la clonación de tu propia voz cantando la canción, o un cuadro en PDF
            con una foto retocada por IA para imprimir.
          </p>
        </Section>

        <Section title="3. Cómo funciona el cobro">
          <p>
            La letra completa y un fragmento de 40 segundos de la canción son gratuitos — solo pagas si quieres
            la canción completa y la página-regalo. El pago es único (sin mensualidad), con tarjeta, procesado
            por Stripe. El precio mostrado al momento de pagar es el precio válido; agregar el cuadro en PDF o
            la voz clonada cambia el monto antes de que confirmes el pago.
          </p>
        </Section>

        <Section title="4. Entrega">
          <p>
            La liberación es automática en cuanto el pago se confirma: la pantalla del sitio libera la canción
            al instante, y además enviamos un correo de respaldo con el enlace, por si cierras la pestaña antes
            de guardarlo. Si el pago no se confirma en algunos minutos, escribe a{" "}
            <a href="mailto:contato@versounicogift.online" className="text-accent underline">
              contato@versounicogift.online
            </a>
            .
          </p>
        </Section>

        <Section title="5. Garantía y reembolso">
          <p>
            Tienes 7 días naturales después de la liberación de la canción para pedir un reembolso, sin
            necesidad de justificar el motivo, conforme a los derechos que te reconoce la Ley Federal de
            Protección al Consumidor. Solo escribe a{" "}
            <a href="mailto:contato@versounicogift.online" className="text-accent underline">
              contato@versounicogift.online
            </a>{" "}
            con el correo usado en la compra.
          </p>
        </Section>

        <Section title="6. Contenido que envías">
          <p>
            Eres responsable de la historia, nombres, fotos y (si eliges la clonación de voz) grabación de audio
            que envías. Al enviar este contenido, declaras tener autorización de las personas involucradas —
            incluida la persona cuya voz será clonada, cuando aplique — para que usemos ese material
            exclusivamente para generar tu canción y tu regalo. No uses el servicio para crear contenido
            ofensivo, ilegal, o que viole derechos de terceros.
          </p>
        </Section>

        <Section title="7. Uso de inteligencia artificial">
          <p>
            La letra, la canción cantada, la clonación de voz y el retoque de fotos son generados por modelos de
            IA de terceros (ver detalles en nuestro{" "}
            <Link href="/mx/privacidad" className="text-accent underline">
              Aviso de Privacidad
            </Link>
            ). Al tratarse de generación automática, pueden ocurrir pequeñas variaciones de calidad entre
            pedidos.
          </p>
        </Section>

        <Section title="8. Cambios en estos términos">
          <p>
            Podemos actualizar estos términos conforme el servicio evoluciona. La versión vigente es siempre la
            publicada en esta página.
          </p>
        </Section>

        <Section title="9. Contacto">
          <p>
            Dudas, reembolso o cualquier otra cosa:{" "}
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

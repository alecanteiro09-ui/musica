import Link from "next/link";

export const metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs uppercase tracking-wide text-accent">termos de uso</p>
      <h1 className="mt-2 font-display text-3xl italic text-ink">Termos de Uso</h1>
      <p className="mt-2 text-sm text-ink-muted">Última atualização: setembro de 2026.</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-muted">
        <Section title="1. Quem somos">
          <p>
            O Verso Único é operado por <strong className="text-ink">LVC DIGITAL LTDA</strong> (CNPJ
            41.949.006/0001-97). Ao criar um pedido no site, você concorda com estes termos.
          </p>
        </Section>

        <Section title="2. O que vendemos">
          <p>
            Uma música original, composta e cantada por inteligência artificial a partir da história que você
            conta sobre alguém. Você recebe: a letra completa, a música cantada, uma página-presente (link e QR
            Code) com fotos e a letra acendendo em karaokê, e o arquivo MP3 pra baixar. Opcionalmente, você pode
            adicionar a clonagem da sua própria voz cantando a música, ou um quadro em PDF com uma foto tratada
            por IA pra imprimir.
          </p>
        </Section>

        <Section title="3. Como funciona a cobrança">
          <p>
            A letra completa e um trecho de 40 segundos da música são gratuitos — você só paga se quiser a
            música completa e a página-presente. O pagamento é único (sem mensalidade), via Pix, processado
            pela Woovi. O preço exibido no momento do checkout é o preço válido; adicionar o quadro em PDF ou a
            voz clonada altera o valor antes de você confirmar o pagamento.
          </p>
        </Section>

        <Section title="4. Entrega">
          <p>
            A liberação é automática assim que o pagamento é confirmado: a tela do próprio site libera a
            música na hora, e enviamos também um e-mail de backup com o link, pro caso de você fechar a aba
            antes de salvar. Se o pagamento não for confirmado em alguns minutos, escreva pra{" "}
            <a href="mailto:contato@versounicogift.online" className="text-accent underline">
              contato@versounicogift.online
            </a>
            .
          </p>
        </Section>

        <Section title="5. Garantia e reembolso">
          <p>
            Você tem 7 dias corridos após a liberação da música pra pedir reembolso, sem precisar justificar o
            motivo. Basta escrever pra{" "}
            <a href="mailto:contato@versounicogift.online" className="text-accent underline">
              contato@versounicogift.online
            </a>{" "}
            com o e-mail usado na compra.
          </p>
        </Section>

        <Section title="6. Conteúdo que você envia">
          <p>
            Você é responsável pela história, nomes, fotos e (se optar pela clonagem de voz) gravação de áudio
            que envia. Ao enviar esse conteúdo, você declara ter autorização das pessoas envolvidas — inclusive
            de quem terá a voz clonada, quando aplicável — pra que a gente use esse material exclusivamente
            pra gerar a sua música e o seu presente. Não use o serviço pra criar conteúdo ofensivo, ilegal, ou
            que viole direitos de terceiros.
          </p>
        </Section>

        <Section title="7. Uso de inteligência artificial">
          <p>
            A letra, a música cantada, a clonagem de voz e o tratamento de fotos são gerados por modelos de IA
            de terceiros (ver detalhes em nossa{" "}
            <Link href="/privacidade" className="text-accent underline">
              Política de Privacidade
            </Link>
            ). Por se tratar de geração automática, pequenas variações de qualidade entre pedidos podem
            acontecer.
          </p>
        </Section>

        <Section title="8. Mudanças nestes termos">
          <p>
            Podemos atualizar estes termos conforme o serviço evolui. A versão vigente é sempre a publicada
            nesta página.
          </p>
        </Section>

        <Section title="9. Contato">
          <p>
            Dúvidas, reembolso ou qualquer outra coisa:{" "}
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

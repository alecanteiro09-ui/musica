export const metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs uppercase tracking-wide text-accent">política de privacidade</p>
      <h1 className="mt-2 font-display text-3xl italic text-ink">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-ink-muted">Última atualização: setembro de 2026.</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-muted">
        <Section title="1. Quem trata seus dados">
          <p>
            <strong className="text-ink">LVC DIGITAL LTDA</strong> (CNPJ 41.949.006/0001-97), operadora do
            Verso Único, é a controladora dos dados pessoais tratados através deste site, nos termos da Lei
            Geral de Proteção de Dados (Lei 13.709/2018).
          </p>
        </Section>

        <Section title="2. Quais dados coletamos">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Nome e e-mail de quem compra.</li>
            <li>
              A história, o apelido, a relação e os detalhes que você escreve (ou dita por voz) sobre a pessoa
              homenageada — usados pra gerar a letra da música.
            </li>
            <li>Fotos, se você optar por incluí-las na página-presente ou no quadro em PDF.</li>
            <li>
              Gravação da sua voz, apenas se você optar pela clonagem de voz — usada exclusivamente pra treinar
              o modelo que canta a música com essa voz.
            </li>
            <li>
              Dados de pagamento (como CPF, telefone e endereço, no caso de pagamento com cartão) — processados
              diretamente pela Woovi; nós não armazenamos número de cartão.
            </li>
          </ul>
        </Section>

        <Section title="3. Por que tratamos esses dados">
          <p>
            Para gerar e entregar a música e o presente que você comprou, processar o pagamento, enviar o
            e-mail de confirmação, e responder seu contato quando você precisar de suporte. A base legal é a
            execução do contrato (a compra que você fez) e, no caso da foto e da voz, o seu consentimento
            explícito ao optar por esses upsells.
          </p>
        </Section>

        <Section title="4. Com quem compartilhamos">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-ink">Woovi</strong> — processamento do pagamento via Pix ou cartão.
            </li>
            <li>
              <strong className="text-ink">Provedores de IA</strong> (Anthropic, e um provedor de geração
              musical/voz/imagem via Kie.ai) — recebem o texto da história, e, quando aplicável, a foto ou a
              gravação de voz, exclusivamente para gerar a letra, a música, a clonagem de voz ou o tratamento
              da foto do seu pedido.
            </li>
            <li>
              <strong className="text-ink">Supabase</strong> — armazenamento do pedido, das faixas de áudio e
              das fotos.
            </li>
            <li>
              <strong className="text-ink">Resend</strong> — envio do e-mail de confirmação.
            </li>
          </ul>
          <p className="mt-2">Não vendemos nem alugamos seus dados pra ninguém.</p>
        </Section>

        <Section title="5. Por quanto tempo guardamos">
          <p>
            Guardamos os dados do seu pedido enquanto a página-presente estiver ativa, pra que o link continue
            funcionando. A gravação de voz usada pra clonagem é enviada a um bucket privado e não fica exposta
            publicamente. Você pode pedir a exclusão dos seus dados a qualquer momento — ver seção 7.
          </p>
        </Section>

        <Section title="6. Segurança">
          <p>
            Os dados ficam em um banco com controle de acesso restrito (nenhuma tabela é lida publicamente sem
            passar pelo código do servidor), e o acesso ao pedido é feito por um link/token privado, não por
            login público. As faixas de áudio e a gravação de voz ficam em armazenamento privado, com URLs
            temporárias geradas só na hora do uso.
          </p>
        </Section>

        <Section title="7. Seus direitos">
          <p>
            Você pode, a qualquer momento, pedir acesso aos seus dados, correção, exclusão, ou revogar um
            consentimento dado (por exemplo, pedir a remoção da foto ou da gravação de voz enviadas). Basta
            escrever pra{" "}
            <a href="mailto:contato@versounico.com.br" className="text-accent underline">
              contato@versounico.com.br
            </a>
            .
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Usamos apenas o mínimo necessário pro site funcionar (por exemplo, lembrar o andamento do seu
            pedido enquanto você preenche o formulário). Não usamos cookies de rastreamento publicitário.
          </p>
        </Section>

        <Section title="9. Mudanças nesta política">
          <p>Podemos atualizar esta política conforme o serviço evolui. A versão vigente é sempre a publicada nesta página.</p>
        </Section>

        <Section title="10. Contato">
          <p>
            Dúvidas sobre seus dados ou esta política:{" "}
            <a href="mailto:contato@versounico.com.br" className="text-accent underline">
              contato@versounico.com.br
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

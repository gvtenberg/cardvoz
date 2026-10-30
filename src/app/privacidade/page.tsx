"use client";

import { Button, Instituicao } from "@/components";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

// Texto curto e direto, de acordo com a LGPD (Lei nº 13.709/2018)
export default function PrivacidadePage() {
  return (
    <main id="main-content" className={styles.main}>
      <h1 className={styles.title}>Política de privacidade</h1>

      <p className={styles.lead}>
        O CardVoz é um projeto de extensão do curso de Sistemas para Internet do{" "}
        <Instituicao />. Você pode usar sem conta, e guardamos só o necessário
        para você estudar.
      </p>

      <section className={styles.panel} aria-labelledby="aparelho">
        <h2 id="aparelho" className={styles.panelTitle}>No seu aparelho</h2>
        <p className={styles.text}>
          Com ou sem conta, o navegador do seu aparelho guarda:
        </p>
        <ul className={styles.list}>
          <li>Seus baralhos e fichas, para você estudar mesmo sem internet.</li>
          <li>Suas escolhas: tema escuro, atalhos do teclado e o aviso de instalar o app.</li>
          <li>Uma cópia das páginas do CardVoz, para o site abrir sem internet.</li>
        </ul>
        <p className={styles.text}>
          Sem conta, seus baralhos não saem do aparelho: nós não recebemos nada.
          Limpar os dados do navegador apaga esses baralhos. Para guardar uma cópia,
          use Exportar.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="o-que">
        <h2 id="o-que" className={styles.panelTitle}>Se você criar uma conta</h2>
        <ul className={styles.list}>
          <li>Seu nome e seu e-mail.</li>
          <li>
            Se você criou uma senha, só uma versão embaralhada dela, que não pode ser
            desfeita: ninguém da equipe consegue ver a sua senha.
          </li>
          <li>
            Se você entra com o Google, um código da sua conta Google, para reconhecer
            você na próxima vez.
          </li>
          <li>Os baralhos e as fichas que você guarda na conta.</li>
          <li>Os resultados das suas sessões de estudo (acertos e erros).</li>
        </ul>
        <p className={styles.text}>
          Não recebemos sua senha do Google nem acesso aos seus e-mails, arquivos ou
          contatos.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="para-que">
        <h2 id="para-que" className={styles.panelTitle}>Para que usamos</h2>
        <p className={styles.text}>
          Só para você entrar e estudar. Seus baralhos são vistos apenas por você. Não
          vendemos nem compartilhamos seus dados, não há publicidade e não usamos
          rastreadores.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="onde">
        <h2 id="onde" className={styles.panelTitle}>Onde ficam</h2>
        <p className={styles.text}>
          Os dados da conta ficam num banco de dados no Supabase, e o site e o servidor
          ficam no Render. No seu aparelho, o navegador guarda uma chave para manter
          você conectado, uma cópia dos baralhos da conta e as alterações que esperam a
          internet voltar.
        </p>
        <p className={styles.text}>
          Ao sair da conta, você escolhe se os baralhos continuam no aparelho ou são
          apagados dele. A chave de acesso é apagada nos dois casos, e os baralhos
          continuam guardados na sua conta.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="direitos">
        <h2 id="direitos" className={styles.panelTitle}>Seus direitos</h2>
        <p className={styles.text}>
          Você pode baixar seus baralhos a qualquer momento com Exportar. Também pode
          pedir uma cópia, a correção ou a exclusão dos seus dados. Fale com a equipe do
          projeto: Élida Cristina, Gutemberg Oliveira e Heitor Oliveira, do{" "}
          <Instituicao />.
        </p>
      </section>

      <p className={styles.updated}>Atualizada em 30 de outubro de 2026.</p>

      <Button href={routes.home} variant="secondary" size="md" block>
        Voltar ao início
      </Button>
    </main>
  );
}

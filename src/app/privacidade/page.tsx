"use client";

import { Button } from "@/components";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

// Texto curto e direto, de acordo com a LGPD (Lei nº 13.709/2018)
export default function PrivacidadePage() {
  return (
    <main id="main-content" className={styles.main}>
      <h1 className={styles.title}>Política de privacidade</h1>

      <p className={styles.lead}>
        O CardVoz é um projeto de extensão do curso de Sistemas para Internet do IFTO,
        Campus Palmas. Guardamos só o necessário para você estudar.
      </p>

      <section className={styles.panel} aria-labelledby="o-que">
        <h2 id="o-que" className={styles.panelTitle}>O que guardamos</h2>
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
          <li>Os baralhos e as fichas que você cria.</li>
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
          Os dados ficam num banco de dados no Supabase, e o site e o servidor ficam no
          Render. No seu aparelho, o navegador guarda uma chave para manter você
          conectado, apagada quando você toca em Sair da conta.
        </p>
        <p className={styles.text}>
          Seus baralhos também ficam guardados no navegador do seu aparelho, com ou sem
          conta, para você estudar sem internet. Ao sair da conta, você escolhe se eles
          continuam no aparelho ou são apagados dali. Limpar os dados do navegador também
          os apaga do aparelho; os que estão na sua conta continuam guardados.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="direitos">
        <h2 id="direitos" className={styles.panelTitle}>Seus direitos</h2>
        <p className={styles.text}>
          Você pode pedir uma cópia, a correção ou a exclusão dos seus dados. Fale com a
          equipe do projeto: Élida Cristina Ferreira Alves e Guntemberg Pereira
          Oliveira, do IFTO, Campus Palmas.
        </p>
      </section>

      <Button href={routes.home} variant="secondary" size="md" block>
        Voltar ao início
      </Button>
    </main>
  );
}

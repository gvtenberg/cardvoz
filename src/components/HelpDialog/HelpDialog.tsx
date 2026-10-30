"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Dialog } from "../Dialog";
import { Button } from "../Button";
import { Kbd } from "../Kbd";
import { setShortcutsEnabled, useShortcutsEnabled } from "@/lib/shortcuts";
import styles from "./HelpDialog.module.scss";

type SectionId = "estudar" | "criar" | "importar" | "teclado" | "conta";

/** Escolhe a seção que já abre expandida conforme a tela em que a pessoa está. */
function sectionForPath(pathname: string): SectionId {
  const path = pathname.replace(/\/+$/, "");
  if (path.startsWith("/estudar")) return "estudar";
  if (path.endsWith("/novo") || path.endsWith("/adicionar")) return "criar";
  if (path.startsWith("/entrar") || path.startsWith("/cadastro") || path.startsWith("/perfil")) {
    return "conta";
  }
  return "estudar";
}

export interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const pathname = usePathname() || "/";
  const current = sectionForPath(pathname);
  const shortcutsEnabled = useShortcutsEnabled();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Como usar"
      footer={
        <Button variant="primary" size="md" onClick={onClose}>
          Entendi
        </Button>
      }
    >
      <p className={styles.intro}>
        O CardVoz funciona com o leitor de tela do seu aparelho (TalkBack, NVDA ou
        VoiceOver). Escolha um assunto:
      </p>

      {/* key força o estado inicial "aberto" a acompanhar a tela atual */}
      <div className={styles.sections} key={current}>
        <details className={styles.section} open={current === "estudar"}>
          <summary className={styles.summary}>Estudar um baralho</summary>
          <ol className={styles.steps}>
            <li>Leia a pergunta e pense na resposta.</li>
            <li>
              Toque em <strong>Ver resposta</strong> para conferir.
            </li>
            <li>
              Toque em <strong>Acertei</strong> ou <strong>Errei</strong>. Se já
              souber, pode tocar em <strong>Acertei</strong> direto, sem abrir a
              resposta.
            </li>
            <li>A próxima pergunta é lida automaticamente pelo leitor de tela.</li>
          </ol>
        </details>

        <details className={styles.section} open={current === "criar"}>
          <summary className={styles.summary}>Criar baralhos e fichas</summary>
          <ol className={styles.steps}>
            <li>
              Em <strong>Meus baralhos</strong>, toque em <strong>Novo baralho</strong>{" "}
              e dê um nome.
            </li>
            <li>
              Dentro do baralho, toque em <strong>Adicionar fichas</strong> e
              escreva a pergunta e a resposta.
            </li>
          </ol>
        </details>

        <details className={styles.section}>
          <summary className={styles.summary}>Importar de um arquivo</summary>
          <p className={styles.text}>
            Você pode trazer várias fichas de uma vez com um arquivo TXT, CSV ou
            JSON. O jeito mais simples é um arquivo de texto com uma ficha por
            linha, separando pergunta e resposta com ponto e vírgula:
          </p>
          <pre className={styles.example}>
            Capital do Brasil?; Brasília{"\n"}2 + 2?; 4
          </pre>
          <p className={styles.text}>
            Arquivos de exemplo:{" "}
            <a href="/modelos/fichas-exemplo.txt" download className={styles.link}>
              TXT
            </a>
            ,{" "}
            <a href="/modelos/fichas-exemplo.csv" download className={styles.link}>
              CSV
            </a>{" "}
            e{" "}
            <a href="/modelos/fichas-exemplo.json" download className={styles.link}>
              JSON
            </a>
            .
          </p>
        </details>

        <details className={styles.section} open={current === "conta"}>
          <summary className={styles.summary}>Entrar e sair da conta</summary>
          <p className={styles.text}>
            Você não precisa de conta para usar o CardVoz: seus baralhos ficam guardados
            neste aparelho. Com uma conta, eles ficam guardados também na internet.
          </p>
          <ol className={styles.steps}>
            <li>
              Para criar sua conta, toque em <strong>Criar conta</strong> e escreva
              seu nome, seu e-mail e uma senha. Depois, entre com o mesmo e-mail e a
              mesma senha.
            </li>
            <li>
              Se preferir, toque em <strong>Entrar com Google</strong> e escolha sua
              conta. Na primeira vez, sua conta no CardVoz é criada sozinha.
            </li>
            <li>
              Marque <strong>Mostrar senha</strong> para conferir o que você digitou.
            </li>
            <li>
              Você continua conectado neste aparelho por até 30 dias, mesmo fechando o
              navegador.
            </li>
            <li>
              Se você tem baralhos neste aparelho, ao entrar o CardVoz pergunta se quer{" "}
              <strong>Levar para a conta</strong>. Se preferir depois, use o botão na
              página do baralho.
            </li>
            <li>
              Para sair, abra o <strong>Menu</strong> e toque em{" "}
              <strong>Sair da conta</strong>. No computador, essa opção fica no{" "}
              <strong>Perfil</strong>. Você escolhe se os baralhos continuam neste
              aparelho ou são apagados dele.
            </li>
          </ol>
          <p className={styles.text}>
            Se o Google mostrar um erro ao abrir o CardVoz de dentro de outro
            aplicativo, como o Instagram, abra o endereço no Chrome.
          </p>
        </details>

        <details className={styles.section}>
          <summary className={styles.summary}>Instalar no celular</summary>
          <p className={styles.text}>
            Instalado, o CardVoz abre direto da tela inicial, como um aplicativo, e
            funciona mesmo sem internet.
          </p>
          <ol className={styles.steps}>
            <li>
              No Android, abra o menu do Chrome (três pontos) e toque em{" "}
              <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
            </li>
            <li>
              No iPhone, abra no Safari, toque em <strong>Compartilhar</strong> e depois
              em <strong>Adicionar à Tela de Início</strong>.
            </li>
          </ol>
        </details>

        <details className={styles.section}>
          <summary className={styles.summary}>Atalhos do teclado</summary>
          <p className={styles.text}>
            Vêm desligados porque o leitor de tela também usa essas teclas. Sem
            eles, use Tab e Enter nos botões.
          </p>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={shortcutsEnabled}
              onChange={(e) => setShortcutsEnabled(e.target.checked)}
            />
            <span>Usar atalhos de uma tecla no estudo</span>
          </label>
          <ul className={styles.shortcuts}>
            <li>
              <Kbd>Espaço</Kbd> <span>Ver resposta</span>
            </li>
            <li>
              <Kbd>1</Kbd> <span>Acertei</span>
            </li>
            <li>
              <Kbd>2</Kbd> <span>Errei</span>
            </li>
          </ul>
          <p className={styles.text}>
            No NVDA, os atalhos funcionam no modo de foco (NVDA + Espaço liga e
            desliga).
          </p>
        </details>
      </div>
    </Dialog>
  );
}

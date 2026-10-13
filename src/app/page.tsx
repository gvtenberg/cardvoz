import { ALargeSmall, CircleCheck, Lock, Volume2 } from "lucide-react";
import { Button, LandingDemo } from "@/components";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

const RECURSOS = [
  {
    icone: Volume2,
    tom: styles.tom1,
    titulo: "Com o leitor de tela que você já usa",
    texto: "Cada pergunta é lida assim que aparece, na voz e na velocidade que você já conhece. Sem uma segunda voz falando por cima.",
  },
  {
    icone: CircleCheck,
    tom: styles.tom2,
    titulo: "“Acertei” sempre no mesmo lugar",
    texto: "Os botões grandes ficam sempre embaixo, na mesma posição. Depois de algumas fichas, a mão encontra “Acertei” sem precisar procurar.",
  },
  {
    icone: ALargeSmall,
    tom: styles.tom3,
    titulo: "Letras grandes, tela limpa",
    texto: "A pergunta aparece em destaque, com letra grande e fácil de ler, sem nada piscando em volta. Você escolhe o fundo claro ou escuro.",
  },
  {
    icone: Lock,
    tom: styles.tom4,
    titulo: "Seus baralhos são só seus",
    texto: "Com a sua conta, suas fichas ficam guardadas para a próxima vez, e ninguém mais vê o que você estuda.",
  },
];

const MATERIAS = [
  "Biologia", "Inglês", "História", "Matemática", "Direito",
  "Vocabulário", "Química", "ENEM e vestibular", "Concursos", "Farmacologia",
];

const PASSOS = [
  { titulo: "Crie um baralho", texto: "Dê um nome, como “Biologia” ou “Inglês para a prova”. É só isso." },
  { titulo: "Escreva suas fichas", texto: "Digite cada pergunta e a resposta. Se já tem uma lista pronta, até numa planilha, dá para trazer todas de uma vez." },
  { titulo: "Estude", texto: "Ouça a pergunta, tente responder de cabeça e confira. Marque “Acertei” ou “Errei” e, no fim, veja quantas você acertou." },
];

const DUVIDAS = [
  { pergunta: "Preciso instalar alguma coisa?", resposta: "Não. O CardVoz abre direto no navegador do celular ou do computador." },
  { pergunta: "Funciona com o meu leitor de tela?", resposta: "Sim. Funciona com o TalkBack no Android, o NVDA no Windows e o VoiceOver no iPhone e no Mac." },
  { pergunta: "Dá para usar no computador?", resposta: "Sim. No computador, dá para estudar só com o teclado: a barra de espaço mostra a resposta, a tecla 1 marca “Acertei” e a tecla 2 marca “Errei”." },
  { pergunta: "Minhas fichas ficam salvas?", resposta: "Ficam. Elas ficam na sua conta, e você continua de onde parou em qualquer aparelho." },
  { pergunta: "Já tenho minhas perguntas numa lista. Preciso digitar tudo de novo?", resposta: "Não. Dá para trazer uma lista ou planilha inteira de uma vez, e cada linha vira uma ficha." },
];

export default function LandingPage() {
  return (
    <>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.hero} aria-labelledby="titulo">
          <div className={`${styles.wrap} ${styles.heroGrade}`}>
            <div className={styles.heroTexto}>
              <h1 id="titulo" className={styles.titulo}>
                Fichas de estudo que o seu <span className={styles.grifo}>leitor de tela</span> entende.
              </h1>
              <p className={styles.lead}>
                O CardVoz é um jeito simples de estudar com perguntas e respostas, feito para pessoas
                cegas e com baixa visão. Você escreve suas fichas, ouve cada pergunta e confere se acertou.
              </p>
              <div className={styles.heroAcoes}>
                <Button href={routes.decks} variant="primary" size="md">
                  Começar a estudar
                </Button>
                <Button href="#como-funciona" variant="secondary" size="md">
                  Como funciona
                </Button>
              </div>
              <div className={styles.leitores}>
                <span>Funciona com:</span>
                <ul>
                  <li>TalkBack</li>
                  <li>NVDA</li>
                  <li>VoiceOver</li>
                </ul>
              </div>
            </div>

            <LandingDemo />
          </div>
        </section>

        <section className={styles.secao} aria-labelledby="para-quem-titulo">
          <div className={styles.wrap}>
            <div className={styles.cabeca}>
              <h2 id="para-quem-titulo">Feito para quem estuda ouvindo</h2>
              <p>Cada detalhe foi pensado para quem usa leitor de tela ou enxerga pouco.</p>
            </div>
            <div className={styles.recursos}>
              {RECURSOS.map(({ icone: Icone, tom, titulo, texto }) => (
                <article key={titulo} className={styles.recurso}>
                  <span className={`${styles.icone} ${tom}`} aria-hidden="true">
                    <Icone />
                  </span>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.faixa} aria-labelledby="materias-titulo">
          <div className={`${styles.wrap} ${styles.faixaGrade}`}>
            <div className={styles.faixaTexto}>
              <h2 id="materias-titulo">Serve para qualquer matéria</h2>
              <p>Você escreve as próprias perguntas, do jeito que o seu professor ou a sua prova cobram.</p>
            </div>
            <ul className={styles.materias} aria-label="Exemplos de matérias">
              {MATERIAS.map((materia) => (
                <li key={materia}>{materia}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.secao} id="como-funciona" aria-labelledby="como-titulo">
          <div className={styles.wrap}>
            <div className={styles.cabeca}>
              <h2 id="como-titulo">Como funciona</h2>
              <p>Do baralho vazio à primeira revisão em poucos minutos.</p>
            </div>
            <ol className={styles.passos}>
              {PASSOS.map(({ titulo, texto }, i) => (
                <li key={titulo} className={styles.passo}>
                  <span className={styles.passoNumero} aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${styles.secao} ${styles.semTopo}`} aria-labelledby="duvidas-titulo">
          <div className={`${styles.wrap} ${styles.duvidas}`}>
            <h2 id="duvidas-titulo">Perguntas frequentes</h2>
            <div className={styles.listaDuvidas}>
              {DUVIDAS.map(({ pergunta, resposta }) => (
                <details key={pergunta}>
                  <summary>{pergunta}</summary>
                  <p>{resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.secao} ${styles.semTopo}`} aria-labelledby="comecar-titulo">
          <div className={styles.wrap}>
            <div className={styles.chamada}>
              <h2 id="comecar-titulo">Monte seu primeiro baralho hoje</h2>
              <p>Escreva algumas fichas e faça a primeira revisão com o leitor de tela que você já conhece.</p>
              <Button href={routes.decks} size="md" className={styles.chamadaBotao}>
                Começar agora
              </Button>
              <div className={styles.chamadaOndas} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.rodape}>
        <div className={styles.wrap}>
          <p>CardVoz é um projeto de extensão do IFTO, campus Palmas.</p>
        </div>
      </footer>
    </>
  );
}

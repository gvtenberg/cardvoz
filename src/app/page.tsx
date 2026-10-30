import Link from "next/link";
import { Headphones, PencilLine, Trophy, Upload } from "lucide-react";
import { Button, LandingDemo } from "@/components";
import { routes } from "@/lib/routes";
import { APP_VERSION } from "@/lib/version";
import styles from "./page.module.scss";

const RECURSOS = [
  {
    icone: PencilLine,
    tom: styles.tom1,
    titulo: "Crie seus próprios cartões",
    texto: "Escreva cada pergunta e a resposta do seu jeito, para a matéria ou a prova que você quiser.",
  },
  {
    icone: Headphones,
    tom: styles.tom2,
    titulo: "Estude ouvindo ou lendo",
    texto: "Ouça as perguntas com o leitor de tela do celular ou do computador, ou leia em letras grandes.",
  },
  {
    icone: Upload,
    tom: styles.tom3,
    titulo: "Traga suas perguntas prontas",
    texto: "Já tem uma lista ou planilha? Importe tudo de uma vez, e cada linha vira um cartão.",
  },
  {
    icone: Trophy,
    tom: styles.tom4,
    titulo: "Veja quanto você acertou",
    texto: "No fim de cada rodada, você vê quantas acertou e pode estudar de novo.",
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
  { pergunta: "Preciso criar uma conta?", resposta: "Não. Você pode criar e estudar seus baralhos sem conta, e eles ficam guardados neste aparelho. Com uma conta, seus baralhos ficam guardados também na internet e você pode usá-los em outro aparelho." },
  { pergunta: "Preciso instalar alguma coisa?", resposta: "Não. O CardVoz abre direto no navegador do celular ou do computador." },
  { pergunta: "Funciona com o meu leitor de tela?", resposta: "Sim. Funciona com o TalkBack, no Android, e com o NVDA, no Windows." },
  { pergunta: "Dá para usar no computador?", resposta: "Sim. No computador, dá para estudar só com o teclado, usando Tab e Enter nos botões. Se preferir, ligue na Ajuda os atalhos de uma tecla: a barra de espaço mostra a resposta, a tecla 1 marca “Acertei” e a tecla 2 marca “Errei”." },
  { pergunta: "Meus cartões ficam salvos?", resposta: "Sim. Ficam guardados neste aparelho e, se você entrar na sua conta, também na sua conta. Para levar para outro lugar, use Exportar." },
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
              {/* Uma frase só: o TalkBack lê tudo de uma vez (as etiquetas são só visuais) */}
              <p className={styles.leitores}>
                Funciona com <span className={styles.leitor}>TalkBack</span> e{" "}
                <span className={styles.leitor}>NVDA</span>.
              </p>
            </div>

            <LandingDemo />
          </div>
        </section>

        <section className={styles.secao} aria-labelledby="para-quem-titulo">
          <div className={styles.wrap}>
            <div className={styles.cabeca}>
              <h2 id="para-quem-titulo">Tudo o que você precisa para estudar</h2>
            </div>
            {/* Título e texto no mesmo parágrafo: o leitor de tela lê cada recurso de uma vez */}
            <ul className={styles.recursos}>
              {RECURSOS.map(({ icone: Icone, tom, titulo, texto }) => (
                <li key={titulo} className={styles.recurso}>
                  <span className={`${styles.icone} ${tom}`} aria-hidden="true">
                    <Icone />
                  </span>
                  <p>
                    <strong className={styles.itemTitulo}>{titulo}</strong>
                    <span className="sr-only">. </span>
                    <br />
                    {texto}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.faixa} aria-labelledby="materias-titulo">
          <div className={`${styles.wrap} ${styles.faixaGrade}`}>
            <div className={styles.faixaTexto}>
              <h2 id="materias-titulo">Serve para qualquer matéria</h2>
              <p>Você escreve as próprias perguntas, do jeito que o seu professor ou a sua prova cobram.</p>
            </div>
            {/* Para o leitor de tela é uma imagem com uma frase curta; quem enxerga vê os nomes */}
            <div
              className={styles.materias}
              role="img"
              aria-label="Exemplos: Biologia, Inglês, Matemática, ENEM, concursos e muitas outras."
            >
              {MATERIAS.map((materia) => (
                <span key={materia}>{materia}</span>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.secao} id="como-funciona" aria-labelledby="como-titulo">
          <div className={styles.wrap}>
            <div className={styles.cabeca}>
              <h2 id="como-titulo">Como funciona</h2>
            </div>
            <ol className={styles.passos}>
              {PASSOS.map(({ titulo, texto }, i) => (
                <li key={titulo} className={styles.passo}>
                  <span className={styles.passoNumero} aria-hidden="true">
                    {i + 1}
                  </span>
                  <p>
                    <strong className={styles.itemTitulo}>{titulo}</strong>
                    <span className="sr-only">. </span>
                    <br />
                    {texto}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${styles.secao} ${styles.semTopo}`} aria-labelledby="duvidas-titulo">
          <div className={`${styles.wrap} ${styles.duvidas}`}>
            <h2 id="duvidas-titulo">Perguntas frequentes</h2>
            {/* Respostas sempre visíveis: sem tocar duas vezes para o TalkBack ler.
                Cada pergunta é um título, para pular de uma para outra */}
            <div className={styles.listaDuvidas}>
              {DUVIDAS.map(({ pergunta, resposta }) => (
                <div key={pergunta} className={styles.duvida}>
                  <h3>{pergunta}</h3>
                  <p>{resposta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.secao} ${styles.semTopo}`} aria-labelledby="comecar-titulo">
          <div className={styles.wrap}>
            <div className={styles.chamada}>
              <h2 id="comecar-titulo">Monte seu primeiro baralho hoje</h2>
              <p>Crie seus cartões e comece a estudar.</p>
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
          <p>{APP_VERSION}</p>
          <p>
            <Link href={routes.privacy} className={styles.rodapeLink}>
              Política de privacidade
            </Link>
          </p>
        </div>
      </footer>
    </>
  );
}

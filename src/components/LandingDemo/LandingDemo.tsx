"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, X } from "lucide-react";
import styles from "./LandingDemo.module.scss";

const FICHAS = [
  { tema: "Biologia", pergunta: "Qual organela produz a energia (ATP) da célula?", resposta: "A mitocôndria." },
  { tema: "Inglês", pergunta: "Qual é o passado do verbo “to go”?", resposta: "Went." },
  { tema: "Matemática", pergunta: "Quantos lados tem um hexágono?", resposta: "Seis." },
];

const SAIDA_MS = 260;
const ENTRADA_MS = 320;

/**
 * Demonstração da landing page: 3 fichas de exemplo com o mesmo comportamento
 * da tela de estudo ("Acertei" fixo à direita, foco na pergunta e na resposta).
 */
export function LandingDemo() {
  const [indice, setIndice] = useState(0);
  const [revelada, setRevelada] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [fase, setFase] = useState<"parada" | "saindo" | "entrando">("parada");

  const perguntaRef = useRef<HTMLHeadingElement>(null);
  const respostaRef = useRef<HTMLHeadingElement>(null);
  const fimRef = useRef<HTMLHeadingElement>(null);
  // Só move o foco depois que a pessoa usar a demonstração (nunca ao abrir a página)
  const interagiu = useRef(false);
  const timers = useRef<number[]>([]);

  const fim = indice >= FICHAS.length;
  const ficha = FICHAS[Math.min(indice, FICHAS.length - 1)];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!interagiu.current) return;
    if (fim) fimRef.current?.focus();
    else perguntaRef.current?.focus();
  }, [indice, fim]);

  useEffect(() => {
    if (revelada) respostaRef.current?.focus();
  }, [revelada]);

  const revelar = () => {
    if (fase !== "parada") return;
    interagiu.current = true;
    setRevelada(true);
  };

  const responder = (acertou: boolean) => {
    if (fase !== "parada") return;
    interagiu.current = true;
    if (acertou) setAcertos((n) => n + 1);

    const proxima = () => {
      setIndice((i) => i + 1);
      setRevelada(false);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      proxima();
      return;
    }
    setFase("saindo");
    timers.current.push(
      window.setTimeout(() => {
        proxima();
        setFase("entrando");
        timers.current.push(window.setTimeout(() => setFase("parada"), ENTRADA_MS));
      }, SAIDA_MS)
    );
  };

  const recomecar = () => {
    interagiu.current = true;
    setIndice(0);
    setRevelada(false);
    setAcertos(0);
  };

  return (
    <section className={styles.demo} aria-labelledby="demo-titulo">
      <h2 className={styles.rotulo} id="demo-titulo">
        Experimente: 3 fichas de exemplo
      </h2>

      <div className={styles.pilha}>
        <div className={`${styles.fundo} ${styles.fundo1}`} aria-hidden="true" />
        <div className={`${styles.fundo} ${styles.fundo2}`} aria-hidden="true" />

        <article
          className={`${styles.ficha} ${fase === "saindo" ? styles.saindo : ""} ${fase === "entrando" ? styles.entrando : ""}`}
          aria-label="Ficha de exemplo"
        >
          {fim ? (
            <div className={styles.fim}>
              <h3 ref={fimRef} tabIndex={-1}>
                Você acertou {acertos} de {FICHAS.length}.
              </h3>
              <p>No CardVoz, você monta os próprios baralhos e estuda no seu ritmo.</p>
              <button type="button" className={`${styles.acao} ${styles.ver}`} onClick={recomecar}>
                Recomeçar
              </button>
            </div>
          ) : (
            <>
              <div className={styles.topo}>
                <span className={styles.tema}>{ficha.tema}</span>
                <span>
                  {indice + 1} de {FICHAS.length}
                </span>
              </div>
              <div className={styles.progresso} aria-hidden="true">
                <span style={{ width: `${Math.round(((indice + 1) / FICHAS.length) * 100)}%` }} />
              </div>

              <h3 ref={perguntaRef} tabIndex={-1} className={styles.face}>
                <span className={styles.faceRotulo}>
                  Pergunta<span className="sr-only"> {indice + 1} de {FICHAS.length}:</span>
                </span>
                <span className={styles.pergunta}>{ficha.pergunta}</span>
              </h3>

              {revelada && (
                <h3 ref={respostaRef} tabIndex={-1} className={`${styles.face} ${styles.resposta}`}>
                  <span className={styles.faceRotulo}>
                    Resposta<span className="sr-only">:</span>
                  </span>
                  <span className={styles.respostaTexto}>{ficha.resposta}</span>
                </h3>
              )}

              {/* "Acertei" fica sempre à direita, como na tela de estudo */}
              <div className={styles.acoes}>
                {revelada ? (
                  <button key="errei" type="button" className={`${styles.acao} ${styles.errei}`} onClick={() => responder(false)}>
                    <X aria-hidden="true" />
                    <span>Errei</span>
                  </button>
                ) : (
                  <button key="ver" type="button" className={`${styles.acao} ${styles.ver}`} onClick={revelar}>
                    <Eye aria-hidden="true" />
                    <span>Ver resposta</span>
                  </button>
                )}
                <button type="button" className={`${styles.acao} ${styles.acertei}`} onClick={() => responder(true)}>
                  <Check aria-hidden="true" />
                  <span>Acertei</span>
                </button>
              </div>
            </>
          )}
        </article>
      </div>

      <p className={styles.dica}>&ldquo;Acertei&rdquo; fica sempre no mesmo lugar, e funciona até sem abrir a resposta.</p>

      {/* Barras de voz da marca, ao lado da pilha */}
      <div className={styles.ondas} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

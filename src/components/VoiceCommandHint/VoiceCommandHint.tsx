import React from "react";
import { Mic, Volume2 } from "lucide-react";
import { Badge } from "../Badge";
import { Kbd } from "../Kbd";
import styles from "./VoiceCommandHint.module.scss";

export function VoiceCommandHint() {
  const commands = [
    {
      action: "Revelar resposta",
      voice: '"Revelar"',
      key: "Espaço",
      description: "Vira a ficha e pronuncia a resposta",
    },
    {
      action: "Marcar acerto",
      voice: '"Acertei"',
      key: "1",
      description: "Registra e avança para a próxima",
    },
    {
      action: "Revisar depois",
      voice: '"Errei"',
      key: "2",
      description: "Marca a ficha para repetição",
    },
    {
      action: "Ouvir de novo",
      voice: '"Repetir"',
      key: "R",
      description: "Reexecuta a leitura por voz",
    },
  ];

  return (
    <aside
      aria-labelledby="guia-rapido-heading"
      className={styles.container}
    >
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.micIcon} aria-hidden="true">
            <Mic />
          </div>
          <div>
            <h2 id="guia-rapido-heading" className={styles.title}>
              Guia Rápido de Estudo por Voz e Teclado
            </h2>
            <p className={styles.subtitle}>
              Estudo sem barreiras visuais: fale os comandos ou use os atalhos físicos do teclado.
            </p>
          </div>
        </div>

        <Badge variant="success" size="sm" className={styles.statusBadge}>
          <Volume2 aria-hidden="true" />
          <span>Áudio Ativo</span>
        </Badge>
      </div>

      <div className={styles.grid}>
        {commands.map((cmd) => (
          <div key={cmd.action} className={styles.commandCard}>
            <div className={styles.cardHeader}>
              <span className={styles.actionName}>{cmd.action}</span>
              <Kbd size="sm">{cmd.key}</Kbd>
            </div>
            <div className={styles.voicePrompt}>
              <span className={styles.voiceLabel}>Voz:</span>
              <span className={styles.voicePhrase}>{cmd.voice}</span>
            </div>
            <p className={styles.description}>{cmd.description}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

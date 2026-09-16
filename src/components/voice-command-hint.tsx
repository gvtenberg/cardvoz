import { Mic, CheckCircle2, XCircle, RotateCcw, Eye } from "lucide-react";
import styles from "./VoiceCommandHint.module.scss";

export function VoiceCommandHint() {
  const commands = [
    {
      action: "Revelar Resposta",
      phrase: 'Diga "Revelar" ou tecla Espaço',
      icon: Eye,
      color: "var(--primary)",
    },
    {
      action: "Marcar Acerto",
      phrase: 'Diga "Acertei" ou tecla 1',
      icon: CheckCircle2,
      color: "var(--success)",
    },
    {
      action: "Marcar Erro / Revisar",
      phrase: 'Diga "Errei" ou tecla 2',
      icon: XCircle,
      color: "var(--destructive)",
    },
    {
      action: "Ouvir Novamente",
      phrase: 'Diga "Repetir" ou tecla R',
      icon: RotateCcw,
      color: "var(--primary)",
    },
  ];

  return (
    <section
      aria-labelledby="voice-commands-heading"
      className={styles.section}
    >
      <div className={styles.header}>
        <div className={styles.iconCircle}>
          <Mic aria-hidden="true" />
        </div>
        <div>
          <h2 id="voice-commands-heading" className={styles.heading}>
            Navegação por Voz & Acessibilidade
          </h2>
          <p className={styles.subheading}>
            O CardVoz foi desenhado com prioridade para pessoas cegas e com baixa visão. Você pode estudar sem olhar para a tela.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {commands.map((cmd) => {
          const Icon = cmd.icon;
          return (
            <div key={cmd.action} className={styles.commandCard}>
              <div className={styles.commandTitle}>
                <Icon style={{ color: cmd.color }} aria-hidden="true" />
                <span>{cmd.action}</span>
              </div>
              <p className={styles.commandKey}>
                {cmd.phrase}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Aviso que precisa sobreviver a uma troca de página (ex.: "Você saiu da sua
 * conta." mostrado já na tela de entrar). Fica no sessionStorage e é apagado
 * ao ser lido. Mensagens com tempo antes de navegar não funcionam: o leitor de
 * tela geralmente não tem tempo de ler.
 */
const NOTICE_KEY = "cardvoz.aviso";

export function setNotice(message: string) {
  try {
    sessionStorage.setItem(NOTICE_KEY, message);
  } catch {}
}

export function takeNotice(): string {
  try {
    const message = sessionStorage.getItem(NOTICE_KEY) || "";
    sessionStorage.removeItem(NOTICE_KEY);
    return message;
  } catch {
    return "";
  }
}

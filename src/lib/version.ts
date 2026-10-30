/**
 * Versão do CardVoz mostrada no rodapé e na Ajuda, para conferir se o deploy
 * novo chegou ao Render sem precisar entrar na conta. O número vem do
 * package.json e o commit do build (next.config.mjs).
 */

export function formatVersion(version: string, commit: string | undefined): string {
  const short = commit?.trim().slice(0, 7);
  return short ? `Versão ${version} (${short})` : `Versão ${version}`;
}

export const APP_VERSION = formatVersion(
  process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
  process.env.NEXT_PUBLIC_APP_COMMIT
);

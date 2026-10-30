/**
 * Levar baralhos do aparelho para a conta, decidir repetidos e o que acontece
 * com as cópias ao sair. As telas (diálogos) ficam em components/AccountTransfer
 * e components/LogoutDialog.
 */
import { ApiError, RouteMissingError, type DeckDetailResponse } from "@/lib/api";
import {
  findLocalDeck,
  fromApiDeck,
  listLocalDecks,
  removeLocalDeck,
  saveLocalDeck,
  updateLocalDeck,
  type LocalDeck,
} from "@/lib/local/decks";
import { clearQueue, hasPendingFor } from "@/lib/local/queue";

export type TransferApi = Pick<
  typeof import("@/lib/api"),
  "importDeck" | "createDeck" | "createCard" | "getDeck" | "deleteDeck"
>;

/** Baralho da conta que "repete" um do aparelho (mesma origem ou mesmo nome). */
export type Duplicate = { remoteId: string; remoteTitle: string } | null;

export type Choice = "levar" | "ficarAparelho" | "ficarConta" | "manterDois";

/** Baralhos que vieram desta conta e não mudaram fora dela voltam a ser da conta, sem perguntar. */
export function relinkUnchanged(userId: string): number {
  let count = 0;
  for (const deck of listLocalDecks()) {
    if (deck.kind === "aparelho" && deck.account?.userId === userId && !deck.editedOffAccount) {
      updateLocalDeck(deck.id, (d) => ({ ...d, kind: "conta" }));
      count++;
    }
  }
  return count;
}

/** O que sobra para oferecer ao entrar: tudo que é só do aparelho. */
export function uploadCandidates(_userId: string): LocalDeck[] {
  return listLocalDecks().filter((d) => d.kind === "aparelho");
}

const normalize = (title: string) => title.trim().toLocaleLowerCase("pt-BR");

export function findDuplicate(local: LocalDeck, userId: string): Duplicate {
  // Veio desta conta e foi editado depois de sair: o original ainda está na conta
  if (local.account?.userId === userId && local.account.remoteId) {
    return { remoteId: local.account.remoteId, remoteTitle: local.title };
  }
  const sameName = listLocalDecks().find(
    (d) => d.kind === "conta" && d.account?.userId === userId && normalize(d.title) === normalize(local.title)
  );
  return sameName ? { remoteId: sameName.id, remoteTitle: sameName.title } : null;
}

/** Troca o baralho do aparelho pela versão que acabou de chegar na conta. */
function replaceWithRemote(local: LocalDeck, remote: DeckDetailResponse, userId: string) {
  // O id antigo continua abrindo o baralho, a não ser que ele seja o id de um baralho da conta
  const keepOld = local.id !== local.account?.remoteId;
  const aliases = keepOld ? [...local.aliases, local.id] : local.aliases;
  removeLocalDeck(local.id);
  saveLocalDeck({ ...fromApiDeck(remote, userId), aliases });
}

async function upload(local: LocalDeck, title: string, userId: string, api: TransferApi) {
  const cards = [...local.cards].sort((a, b) => a.displayOrder - b.displayOrder);
  let remoteId = local.upload?.remoteId ?? null;
  let sentCount = 0;

  if (remoteId) {
    // Retomada: continua de onde a conta parou (as fichas vão uma a uma, em ordem)
    const partial = await api.getDeck(remoteId);
    if (partial) sentCount = partial.cards.length;
    else remoteId = null;
  }

  if (!remoteId) {
    try {
      const created = await api.importDeck({
        title,
        category: local.category,
        cards: cards.map((c) => ({ question: c.question, answer: c.answer })),
      });
      replaceWithRemote(local, created, userId);
      return;
    } catch (error) {
      if (!(error instanceof RouteMissingError)) throw error;
    }
    const created = await api.createDeck({ title, category: local.category });
    remoteId = created.id;
    // Guarda antes das fichas: se cair a internet, a próxima tentativa continua daqui
    updateLocalDeck(local.id, (d) => ({ ...d, upload: { remoteId: created.id } }));
  }

  for (let i = sentCount; i < cards.length; i++) {
    await api.createCard({
      deckId: remoteId,
      question: cards[i].question,
      answer: cards[i].answer,
      displayOrder: i + 1,
    });
  }

  const finished = await api.getDeck(remoteId);
  if (!finished) throw new ApiError(404, "O baralho não foi encontrado na sua conta.");
  replaceWithRemote(findLocalDeck(local.id) ?? local, finished, userId);
}

export async function transferDeck(
  local: LocalDeck,
  choice: Choice,
  userId: string,
  api: TransferApi,
  duplicate: Duplicate
): Promise<void> {
  switch (choice) {
    case "levar":
      return upload(local, local.title, userId, api);

    case "manterDois":
      return upload(local, `${local.title} (do aparelho)`, userId, api);

    case "ficarAparelho": {
      if (duplicate) {
        try {
          await api.deleteDeck(duplicate.remoteId);
        } catch (error) {
          // Já não existe na conta: segue levando o do aparelho
          if (!(error instanceof ApiError && error.status === 404)) throw error;
        }
        const copy = findLocalDeck(duplicate.remoteId);
        if (copy && copy.id === duplicate.remoteId && copy.kind === "conta") removeLocalDeck(copy.id);
      }
      return upload(findLocalDeck(local.id) ?? local, local.title, userId, api);
    }

    case "ficarConta": {
      removeLocalDeck(local.id);
      if (duplicate) {
        const remote = await api.getDeck(duplicate.remoteId);
        if (remote) saveLocalDeck(fromApiDeck(remote, userId));
      }
      return;
    }
  }
}

/** Sair mantendo: as cópias viram baralhos do aparelho, livres para editar sem login. */
export function convertCopiesToDevice(userId: string): void {
  for (const deck of listLocalDecks()) {
    if (deck.kind !== "conta" || deck.account?.userId !== userId) continue;
    const neverSent = !deck.account.remoteId;
    // Alterações que não chegaram à conta já estão aplicadas aqui: na volta, a pessoa decide
    const pending = hasPendingFor(userId, deck.id);
    updateLocalDeck(deck.id, (d) => ({
      ...d,
      kind: "aparelho",
      account: neverSent ? null : d.account,
      editedOffAccount: pending && !neverSent,
    }));
  }
  clearQueue();
}

/** Sair apagando: as cópias saem do aparelho (continuam na conta). */
export function removeAccountCopies(userId: string): void {
  for (const deck of listLocalDecks()) {
    if (deck.kind !== "conta" || deck.account?.userId !== userId) continue;
    if (deck.account.remoteId) {
      removeLocalDeck(deck.id);
    } else {
      // Criado sem internet e nunca enviado: só existe aqui, então não é apagado
      updateLocalDeck(deck.id, (d) => ({ ...d, kind: "aparelho", account: null }));
    }
  }
  clearQueue();
}

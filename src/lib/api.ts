/**
 * CardVoz - Cliente de Integração com a API C# (.NET 9)
 *
 * Fornece métodos tipados para comunicação RESTful com a API de baralhos,
 * cartões e sessões de estudo do CardVoz, com fallback resiliente para
 * execução estática e suporte offline gracioso.
 */

export interface DeckResponse {
  id: number;
  slug: string;
  title: string;
  category: string;
  description?: string | null;
  cardCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DeckDetailResponse {
  id: number;
  slug: string;
  title: string;
  category: string;
  description?: string | null;
  cardCount: number;
  createdAt: string;
  updatedAt?: string | null;
  cards: CardResponse[];
}

export interface CardResponse {
  id: number;
  deckId: number;
  question: string;
  answer: string;
  voiceNotes?: string | null;
  displayOrder: number;
  createdAt: string;
}

export interface StudySessionResponse {
  id: number;
  deckId: number;
  deckTitle?: string | null;
  deckSlug?: string | null;
  startedAt: string;
  completedAt?: string | null;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
  scorePercentage: number;
  isCompleted?: boolean;
  reviews?: StudyReviewResponse[];
}

export interface StudyReviewResponse {
  id: number;
  studySessionId: number;
  cardId: number;
  wasCorrect: boolean;
  voiceUsed: boolean;
  answeredAt: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:5000/api";

/**
 * Dados padrão de fallback para garantir resiliência e SSR estático caso a API
 * esteja temporariamente indisponível.
 */
const FALLBACK_DECKS: DeckDetailResponse[] = [
  {
    id: 1,
    slug: "biologia-celular",
    title: "Biologia Celular",
    category: "Ciências Biológicas",
    description:
      "Estruturas celulares, organelas, respiração celular, fotossíntese e funções da membrana plasmática.",
    cardCount: 4,
    createdAt: "2026-09-24T17:45:00.000Z",
    cards: [
      {
        id: 1,
        deckId: 1,
        question:
          "Qual organela celular é responsável pela produção de energia (ATP) por meio da respiração celular?",
        answer: "A mitocôndria.",
        voiceNotes: "Dica: mitocôndria, respiração celular, ATP",
        displayOrder: 1,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 2,
        deckId: 1,
        question:
          "Qual estrutura delimita a célula e controla a entrada e saída de substâncias?",
        answer: "A membrana plasmática (ou plasmalema).",
        voiceNotes: "Dica: membrana plasmática ou plasmalema",
        displayOrder: 2,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 3,
        deckId: 1,
        question: "Qual organela é responsável pela síntese de proteínas nas células?",
        answer: "Os ribossomos.",
        voiceNotes: "Dica: ribossomos ou síntese proteica",
        displayOrder: 3,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 4,
        deckId: 1,
        question: "Qual organela realiza a fotossíntese nas células vegetais e algas?",
        answer: "Os cloroplastos.",
        voiceNotes: "Dica: cloroplasto ou fotossíntese",
        displayOrder: 4,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
    ],
  },
  {
    id: 2,
    slug: "ingles-verbos-irregulares",
    title: "Inglês - Verbos Irregulares",
    category: "Idiomas",
    description:
      "Formas infinitivo, passado simples (Past Simple) e particípio passado (Past Participle) dos verbos mais usados.",
    cardCount: 4,
    createdAt: "2026-09-24T17:45:00.000Z",
    cards: [
      {
        id: 5,
        deckId: 2,
        question: "Qual é o passado simples (Past Simple) e particípio de 'to go'?",
        answer: "Went (passado simples) e Gone (particípio).",
        voiceNotes: "Dica: went e gone",
        displayOrder: 1,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 6,
        deckId: 2,
        question: "Qual é o passado simples e particípio de 'to write'?",
        answer: "Wrote (passado simples) e Written (particípio).",
        voiceNotes: "Dica: wrote e written",
        displayOrder: 2,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 7,
        deckId: 2,
        question: "Qual é o passado simples e particípio de 'to take'?",
        answer: "Took (passado simples) e Taken (particípio).",
        voiceNotes: "Dica: took e taken",
        displayOrder: 3,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 8,
        deckId: 2,
        question: "Qual é o passado simples e particípio de 'to see'?",
        answer: "Saw (passado simples) e Seen (particípio).",
        voiceNotes: "Dica: saw e seen",
        displayOrder: 4,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
    ],
  },
  {
    id: 3,
    slug: "historia-do-brasil",
    title: "História do Brasil - República Velha",
    category: "Humanidades",
    description:
      "Movimentos sociais, política do café com leite, revoltas populares e a transição para a Era Vargas.",
    cardCount: 4,
    createdAt: "2026-09-24T17:45:00.000Z",
    cards: [
      {
        id: 9,
        deckId: 3,
        question: "O que caracterizou a chamada 'Política do Café com Leite' na República Velha?",
        answer:
          "A alternância na presidência da República entre as oligarquias agrárias de São Paulo (café) e Minas Gerais (leite).",
        voiceNotes: "Dica: alternância São Paulo e Minas Gerais",
        displayOrder: 1,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 10,
        deckId: 3,
        question:
          "Qual revolta popular ocorreu em 1904 no Rio de Janeiro contra a vacinação compulsória contra a varíola?",
        answer:
          "A Revolta da Vacina, liderada no campo sanitário pelo médico sanitarista Oswaldo Cruz.",
        voiceNotes: "Dica: Revolta da Vacina, Oswaldo Cruz",
        displayOrder: 2,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 11,
        deckId: 3,
        question:
          "Qual movimento messiânico liderado por Antônio Conselheiro ocorreu no sertão da Bahia entre 1896 e 1897?",
        answer: "A Guerra de Canudos.",
        voiceNotes: "Dica: Canudos ou Antônio Conselheiro",
        displayOrder: 3,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 12,
        deckId: 3,
        question:
          "Qual revolta de marinheiros contra castigos corporais na Marinha ocorreu em 1910 no Rio de Janeiro?",
        answer:
          "A Revolta da Chibata, liderada por João Cândido (o 'Almirante Negro').",
        voiceNotes: "Dica: Revolta da Chibata, João Cândido",
        displayOrder: 4,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
    ],
  },
  {
    id: 4,
    slug: "acessibilidade-web",
    title: "Acessibilidade na Web & WCAG",
    category: "Tecnologia",
    description:
      "Critérios de conformidade WCAG 2.1 níveis A, AA e AAA, navegação por teclado e semântica WAI-ARIA.",
    cardCount: 4,
    createdAt: "2026-09-24T17:45:00.000Z",
    cards: [
      {
        id: 13,
        deckId: 4,
        question:
          "Quais são os quatro princípios fundamentais das diretrizes WCAG 2.1 (POUR)?",
        answer:
          "Perceptível, Operável, Compreensível e Robusto (Perceivable, Operable, Understandable, Robust).",
        voiceNotes: "Dica: perceptível, operável, compreensível e robusto",
        displayOrder: 1,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 14,
        deckId: 4,
        question:
          "Qual é a taxa mínima de contraste recomendada pela WCAG nível AA para texto normal?",
        answer: "4.5:1 para texto normal e 3:1 para texto grande.",
        voiceNotes: "Dica: 4.5 para 1",
        displayOrder: 2,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 15,
        deckId: 4,
        question:
          "Para que serve a técnica de 'Skip Link' (pular para o conteúdo principal)?",
        answer:
          "Permite que usuários de leitor de tela e navegação por teclado pulem blocos repetitivos de navegação e vão direto ao conteúdo principal (#main-content).",
        voiceNotes: "Dica: pular navegação para conteúdo principal",
        displayOrder: 3,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
      {
        id: 16,
        deckId: 4,
        question:
          "O que o atributo aria-live='polite' faz em uma região dinâmica de leitor de tela?",
        answer:
          "Informa aos leitores de tela para anunciarem as alterações de conteúdo assim que o sintetizador terminar a fala atual, sem interromper o usuário.",
        voiceNotes: "Dica: anúncio sem interrupção",
        displayOrder: 4,
        createdAt: "2026-09-24T17:45:00.000Z",
      },
    ],
  },
];

let localDecksMemory = [...FALLBACK_DECKS];
let localSessionsMemory: StudySessionResponse[] = [];

/**
 * Função utilitária para requisições seguras à API REST
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      // Ignora falha de parse
    }
    throw new Error(errorDetail);
  }

  // 204 No Content
  if (response.status === 204) {
    return true as unknown as T;
  }

  return response.json();
}

/**
 * 1. Lista todos os baralhos cadastrados
 */
export async function getDecks(
  category?: string,
  search?: string
): Promise<DeckResponse[]> {
  try {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (search) params.append("search", search);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const decks = await fetchApi<DeckResponse[]>(`/decks${queryString}`, {
      cache: "no-store",
    });
    return decks;
  } catch (error) {
    console.warn("CardVoz: Falha ao carregar baralhos da API C#, usando dados locais:", error);
    let list: DeckResponse[] = localDecksMemory.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      category: d.category,
      description: d.description,
      cardCount: d.cards?.length || d.cardCount || 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    if (category) {
      list = list.filter(
        (d) => d.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(term) ||
          (d.description && d.description.toLowerCase().includes(term))
      );
    }
    return list;
  }
}

/**
 * 2. Obtém detalhes de um baralho específico por ID ou Slug
 */
export async function getDeck(
  idOrSlug: string | number
): Promise<DeckDetailResponse | null> {
  try {
    const deck = await fetchApi<DeckDetailResponse>(`/decks/${encodeURIComponent(idOrSlug)}`, {
      cache: "no-store",
    });
    return deck;
  } catch (error) {
    console.warn(`CardVoz: Falha ao obter baralho '${idOrSlug}' da API C#, buscando no fallback:`, error);
    const searchKey = String(idOrSlug).toLowerCase();
    const found = localDecksMemory.find(
      (d) => String(d.id) === searchKey || d.slug.toLowerCase() === searchKey
    );
    return found || null;
  }
}

/**
 * 3. Cria um novo baralho
 */
export async function createDeck(data: {
  title: string;
  category: string;
  description?: string;
}): Promise<DeckResponse> {
  try {
    return await fetchApi<DeckResponse>("/decks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.warn("CardVoz: Falha ao criar baralho na API C#, persistindo localmente:", error);
    const newId = Math.max(0, ...localDecksMemory.map((d) => d.id)) + 1;
    const slug = data.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const newDeck: DeckDetailResponse = {
      id: newId,
      slug: slug || `baralho-${newId}`,
      title: data.title,
      category: data.category,
      description: data.description || null,
      cardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      cards: [],
    };

    localDecksMemory.unshift(newDeck);
    return {
      id: newDeck.id,
      slug: newDeck.slug,
      title: newDeck.title,
      category: newDeck.category,
      description: newDeck.description,
      cardCount: 0,
      createdAt: newDeck.createdAt,
    };
  }
}

/**
 * 4. Atualiza um baralho existente
 */
export async function updateDeck(
  id: number,
  data: { title?: string; category?: string; description?: string }
): Promise<DeckResponse> {
  try {
    return await fetchApi<DeckResponse>(`/decks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.warn(`CardVoz: Falha ao atualizar baralho ${id} na API C#:`, error);
    const index = localDecksMemory.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Baralho com ID ${id} não encontrado.`);
    }
    const current = localDecksMemory[index];
    const updated: DeckDetailResponse = {
      ...current,
      title: data.title ?? current.title,
      category: data.category ?? current.category,
      description: data.description !== undefined ? data.description : current.description,
      updatedAt: new Date().toISOString(),
    };
    localDecksMemory[index] = updated;
    return updated;
  }
}

/**
 * 5. Exclui um baralho e suas fichas
 */
export async function deleteDeck(id: number): Promise<boolean> {
  try {
    await fetchApi<void>(`/decks/${id}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.warn(`CardVoz: Falha ao excluir baralho ${id} na API C#, removendo localmente:`, error);
    localDecksMemory = localDecksMemory.filter((d) => d.id !== id);
    return true;
  }
}

/**
 * 6. Retorna todas as categorias únicas de baralhos
 */
export async function getCategories(): Promise<string[]> {
  try {
    return await fetchApi<string[]>("/decks/categories", {
      cache: "no-store",
    });
  } catch (error) {
    console.warn("CardVoz: Falha ao carregar categorias da API C#:", error);
    const unique = Array.from(new Set(localDecksMemory.map((d) => d.category)));
    return unique;
  }
}

/**
 * 7. Retorna as fichas de um baralho específico
 */
export async function getCards(deckId: number): Promise<CardResponse[]> {
  try {
    return await fetchApi<CardResponse[]>(`/decks/${deckId}/cards`, {
      cache: "no-store",
    });
  } catch (error) {
    console.warn(`CardVoz: Falha ao carregar fichas do baralho ${deckId} da API C#:`, error);
    const deck = localDecksMemory.find((d) => d.id === deckId);
    return deck?.cards || [];
  }
}

/**
 * 8. Cadastra uma nova ficha em um baralho
 */
export async function createCard(data: {
  deckId: number;
  question: string;
  answer: string;
  voiceNotes?: string;
  displayOrder?: number;
}): Promise<CardResponse> {
  try {
    return await fetchApi<CardResponse>("/cards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.warn("CardVoz: Falha ao criar ficha na API C#, persistindo localmente:", error);
    const deck = localDecksMemory.find((d) => d.id === data.deckId);
    if (!deck) {
      throw new Error(`Baralho com ID ${data.deckId} não encontrado.`);
    }

    const newCardId = Math.floor(Math.random() * 100000) + 100;
    const newCard: CardResponse = {
      id: newCardId,
      deckId: data.deckId,
      question: data.question,
      answer: data.answer,
      voiceNotes: data.voiceNotes || null,
      displayOrder: data.displayOrder || deck.cards.length + 1,
      createdAt: new Date().toISOString(),
    };

    deck.cards.push(newCard);
    deck.cardCount = deck.cards.length;
    return newCard;
  }
}

/**
 * 9. Atualiza uma ficha existente
 */
export async function updateCard(
  id: number,
  data: {
    question?: string;
    answer?: string;
    voiceNotes?: string;
    displayOrder?: number;
  }
): Promise<CardResponse> {
  try {
    return await fetchApi<CardResponse>(`/cards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.warn(`CardVoz: Falha ao atualizar ficha ${id} na API C#:`, error);
    for (const deck of localDecksMemory) {
      const card = deck.cards.find((c) => c.id === id);
      if (card) {
        if (data.question !== undefined) card.question = data.question;
        if (data.answer !== undefined) card.answer = data.answer;
        if (data.voiceNotes !== undefined) card.voiceNotes = data.voiceNotes;
        if (data.displayOrder !== undefined) card.displayOrder = data.displayOrder;
        return card;
      }
    }
    throw new Error(`Ficha com ID ${id} não encontrada.`);
  }
}

/**
 * 10. Exclui uma ficha
 */
export async function deleteCard(id: number): Promise<boolean> {
  try {
    await fetchApi<void>(`/cards/${id}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.warn(`CardVoz: Falha ao excluir ficha ${id} na API C#:`, error);
    for (const deck of localDecksMemory) {
      const idx = deck.cards.findIndex((c) => c.id === id);
      if (idx !== -1) {
        deck.cards.splice(idx, 1);
        deck.cardCount = deck.cards.length;
        return true;
      }
    }
    return true;
  }
}

/**
 * 11. Inicia uma sessão de estudo por voz/teclado
 */
export async function startStudySession(data: {
  deckId?: number;
  deckSlug?: string;
}): Promise<StudySessionResponse> {
  try {
    return await fetchApi<StudySessionResponse>("/study-sessions/start", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.warn("CardVoz: Falha ao iniciar sessão de estudo na API C#, usando sessão local:", error);
    const deck = localDecksMemory.find(
      (d) =>
        (data.deckId && d.id === data.deckId) ||
        (data.deckSlug && d.slug.toLowerCase() === data.deckSlug.toLowerCase())
    );

    const newSession: StudySessionResponse = {
      id: Date.now(),
      deckId: deck?.id || 1,
      deckTitle: deck?.title || "Sessão de Estudo",
      deckSlug: deck?.slug || "estudo",
      startedAt: new Date().toISOString(),
      completedAt: null,
      totalCards: deck?.cards.length || 4,
      correctCount: 0,
      incorrectCount: 0,
      scorePercentage: 0,
      isCompleted: false,
      reviews: [],
    };
    localSessionsMemory.unshift(newSession);
    return newSession;
  }
}

/**
 * 12. Registra o resultado da revisão de uma ficha durante a sessão ativa
 */
export async function recordStudyReview(
  sessionId: number,
  data: { cardId: number; wasCorrect: boolean; voiceUsed: boolean }
): Promise<StudySessionResponse> {
  try {
    await fetchApi<StudyReviewResponse>(`/study-sessions/${sessionId}/review`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Retorna a sessão consolidada atualizada
    return await fetchApi<StudySessionResponse>(`/study-sessions/${sessionId}`, {
      cache: "no-store",
    });
  } catch (error) {
    console.warn(`CardVoz: Falha ao registrar revisão da sessão ${sessionId} na API C#:`, error);
    const session = localSessionsMemory.find((s) => s.id === sessionId);
    if (session) {
      if (data.wasCorrect) {
        session.correctCount += 1;
      } else {
        session.incorrectCount += 1;
      }
      session.scorePercentage =
        session.totalCards > 0
          ? Math.round((session.correctCount / session.totalCards) * 100)
          : 0;
      session.reviews = session.reviews || [];
      session.reviews.push({
        id: Date.now(),
        studySessionId: sessionId,
        cardId: data.cardId,
        wasCorrect: data.wasCorrect,
        voiceUsed: data.voiceUsed,
        answeredAt: new Date().toISOString(),
      });
      return session;
    }

    return {
      id: sessionId,
      deckId: 1,
      startedAt: new Date().toISOString(),
      totalCards: 4,
      correctCount: data.wasCorrect ? 1 : 0,
      incorrectCount: data.wasCorrect ? 0 : 1,
      scorePercentage: data.wasCorrect ? 25 : 0,
      isCompleted: false,
    };
  }
}

/**
 * 13. Finaliza a sessão de estudo e calcula a pontuação final
 */
export async function finishStudySession(
  sessionId: number
): Promise<StudySessionResponse> {
  try {
    return await fetchApi<StudySessionResponse>(
      `/study-sessions/${sessionId}/finish`,
      {
        method: "POST",
      }
    );
  } catch (error) {
    console.warn(`CardVoz: Falha ao finalizar sessão ${sessionId} na API C#:`, error);
    const session = localSessionsMemory.find((s) => s.id === sessionId);
    if (session) {
      session.completedAt = new Date().toISOString();
      session.isCompleted = true;
      return session;
    }
    return {
      id: sessionId,
      deckId: 1,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      totalCards: 4,
      correctCount: 4,
      incorrectCount: 0,
      scorePercentage: 100,
      isCompleted: true,
    };
  }
}

/**
 * 14. Consulta o histórico de sessões de estudo
 */
export async function getStudyHistory(
  deckId?: number
): Promise<StudySessionResponse[]> {
  try {
    const query = deckId ? `?deckId=${deckId}` : "";
    return await fetchApi<StudySessionResponse[]>(`/study-sessions/history${query}`, {
      cache: "no-store",
    });
  } catch (error) {
    console.warn("CardVoz: Falha ao carregar histórico de sessões da API C#:", error);
    if (deckId) {
      return localSessionsMemory.filter((s) => s.deckId === deckId);
    }
    return localSessionsMemory;
  }
}

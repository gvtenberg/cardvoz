// GitHub Actions: cria um cartão (issue) para cada teste ou pergunta nova do TESTES-PENDENTES.md
// e fecha os cartões cujo teste saiu do arquivo (resolvido pelo /testes). Usa o GITHUB_TOKEN da Action.
const fs = require('node:fs')
const { lerTestes, corpoDoCartao, numeroDoCartao } = require('./testes-pendentes.js')

const repositorio = process.env.GITHUB_REPOSITORY
const api = `https://api.github.com/repos/${repositorio}`
const cabecalhos = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json'
}

async function chamar (metodo, caminho, dados) {
  const resposta = await fetch(api + caminho, { method: metodo, headers: cabecalhos, body: dados && JSON.stringify(dados) })
  if (!resposta.ok && resposta.status !== 422) throw new Error(`${metodo} ${caminho}: ${resposta.status} ${await resposta.text()}`)
  return resposta.status === 204 ? null : resposta.json()
}

async function todosOsCartoes () {
  const cartoes = []
  for (let pagina = 1; ; pagina++) {
    const lote = await chamar('GET', `/issues?labels=teste&state=all&per_page=100&page=${pagina}`)
    cartoes.push(...lote.filter(c => !c.pull_request))
    if (lote.length < 100) return cartoes
  }
}

;(async () => {
  await chamar('POST', '/labels', { name: 'teste', color: '0e8a16', description: 'Teste manual do CardVoz' })
  await chamar('POST', '/labels', { name: 'pergunta', color: '1d76db', description: 'Pergunta para a equipe responder' })

  const itens = lerTestes(fs.readFileSync('TESTES-PENDENTES.md', 'utf8'))
  const noArquivo = new Set(itens.map(i => i.numero))
  const cartoes = await todosOsCartoes()
  const jaTemCartao = new Set(cartoes.map(numeroDoCartao))

  for (const item of itens) {
    if (jaTemCartao.has(item.numero)) continue // número nunca é reaproveitado: um cartão por teste
    const labels = item.numero.startsWith('P') ? ['teste', 'pergunta'] : ['teste']
    await chamar('POST', '/issues', { title: `${item.numero} – ${item.titulo}`, body: corpoDoCartao(item), labels })
    console.log(`Cartão criado: ${item.numero} – ${item.titulo}`)
  }

  for (const cartao of cartoes) {
    const numero = numeroDoCartao(cartao)
    if (cartao.state !== 'open' || !numero || noArquivo.has(numero)) continue
    await chamar('POST', `/issues/${cartao.number}/comments`, { body: 'Resolvido: o teste saiu do TESTES-PENDENTES.md.' })
    await chamar('PATCH', `/issues/${cartao.number}`, { state: 'closed', state_reason: 'completed' })
    console.log(`Cartão fechado: ${cartao.title}`)
  }
})().catch(erro => { console.error(erro.message); process.exit(1) })

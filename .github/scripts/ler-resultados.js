// Mostra, em poucas linhas, o que foi marcado
// nos cartões de teste do GitHub (repositório público: não precisa de senha). Comando:
//   node .github/scripts/ler-resultados.js
const { resultadoDoCartao, numeroDoCartao } = require('./testes-pendentes.js')
const api = 'https://api.github.com/repos/gvtenberg/cardvoz'
const cabecalhos = { Accept: 'application/vnd.github+json', 'User-Agent': 'cardvoz-testes' }

async function obter (caminho) {
  const resposta = await fetch(api + caminho, { headers: cabecalhos })
  if (!resposta.ok) throw new Error(`${caminho}: ${resposta.status} ${await resposta.text()}`)
  return resposta.json()
}

;(async () => {
  const cartoes = (await obter('/issues?labels=teste&state=open&per_page=100')).filter(c => !c.pull_request)
  let semNovidade = 0
  for (const cartao of cartoes.sort((a, b) => a.number - b.number)) {
    const resultado = resultadoDoCartao(cartao.body)
    if (resultado === 'não marcado' && !cartao.comments) { semNovidade++; continue }
    console.log(`\n${numeroDoCartao(cartao)} (cartão #${cartao.number}): ${resultado}`)
    if (cartao.comments) {
      for (const c of await obter(`/issues/${cartao.number}/comments`)) {
        if (c.body.startsWith('Resolvido:')) continue
        console.log(`  Comentário (${c.created_at.slice(0, 10)}): ${c.body.replace(/\s+/g, ' ').trim()}`)
      }
    }
  }
  console.log(`\nCartões abertos sem marca nem comentário: ${semNovidade}`)
})().catch(erro => { console.error('Não foi possível ler o GitHub: ' + erro.message); process.exit(1) })

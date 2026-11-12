// Para o /testes: apaga do TESTES-PENDENTES.md os testes resolvidos, sem ler o arquivo inteiro.
//   node .github/scripts/apagar-testes.js T03 T05 P1
const fs = require('node:fs')
const { apagarTestes, lerTestes } = require('./testes-pendentes.js')
const arquivo = 'TESTES-PENDENTES.md'
const numeros = process.argv.slice(2)
const antes = fs.readFileSync(arquivo, 'utf8')
const depois = apagarTestes(antes, numeros)
const contar = texto => lerTestes(texto).length
const esperado = contar(antes) - lerTestes(antes).filter(i => numeros.includes(i.numero)).length
if (contar(depois) !== esperado) { console.error('Conferência falhou: nada foi apagado.'); process.exit(1) }
fs.writeFileSync(arquivo, depois)
console.log(`Apagados: ${numeros.join(', ')}. Antes: ${contar(antes)}; agora: ${contar(depois)}.`)

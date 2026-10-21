// Recebe os ids na ordem atual, tira o item e o coloca na nova posição.
// Posição maior que o tamanho da lista manda o item para o final.
export function inserirNaPosicao(idsNaOrdem, idDoItem, posicao) {
    const restantes = idsNaOrdem.filter((id) => id !== idDoItem);
    const indice = Math.min(posicao, restantes.length);

    restantes.splice(indice, 0, idDoItem);

    return restantes;
}

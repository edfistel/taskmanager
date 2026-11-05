# Roteiro de demonstração do TaskFlow

## Antes da apresentação

- Na raiz do projeto, execute `npm run dev`.
- Abra http://localhost:3000/login. Essa é a aplicação conectada ao banco real.
- Confira http://localhost:3000/health: deve responder `status: OK` e `database: connected`.
- Mantenha o terminal aberto e a conexão de internet disponível para acessar o PostgreSQL remoto.
- Use contas e registros próprios da apresentação, separados dos dados existentes. Não mostre `.env` nem credenciais nos slides ou na tela compartilhada.
- Para outra máquina, execute `npm install` na raiz (instala backend e frontend automaticamente) e configure a `.env` local conforme o README. Confirme o acesso ao banco nessa máquina antes do dia da apresentação.

## Sequência sugerida

1. **Cadastro e login:** crie uma conta da apresentação ou entre com uma conta já preparada. Use uma senha própria; a senha do banco não é a senha da conta do aplicativo.
2. **Painel:** mostre os quadros, a busca e o resumo de atribuições.
3. **Quadro e listas:** crie um quadro e mostre a lista inicial automática. Adicione uma segunda lista e renomeie uma etapa.
4. **Tarefa:** crie uma tarefa com descrição, prazo e status. Abra os detalhes, edite e salve.
5. **Movimentação:** arraste o cartão para outra lista. Mostre também “Mover para…”. Explique que mover uma tarefa não altera seu status automaticamente.
6. **Persistência:** recarregue a página e confira se as alterações permanecem. Saia e entre novamente para demonstrar que os dados estão associados à conta.
7. **Colaboração:** com uma segunda conta em janela anônima, atribua uma tarefa pelo e-mail dessa conta. Mostre “Minhas atribuições”, comentários e conclusão de subtarefas. Compare os controles do proprietário com os do colaborador.
8. **Configurações:** abra a engrenagem ou o perfil; mostre tema claro/escuro, densidade, redução de movimento e perfil. Demonstre validações de senha sem revelar senhas na apresentação.
9. **Confirmações e saída:** mostre a confirmação de exclusão e cancele. Evite excluir a conta ou os dados principais da apresentação. Encerre a sessão para voltar ao login.

## O que está implementado

- Login, cadastro, sessão renovável e saída.
- Quadros, listas, tarefas, movimentação e confirmação de exclusão.
- Detalhes, prazo, status, subtarefas, comentários e responsáveis.
- Atribuições com busca, filtros e separação de permissões.
- Configurações de aparência, perfil, troca de senha e exclusão da conta.
- Layouts para desktop, tablet e celular.

As configurações e os detalhes são painéis/modais dentro da aplicação, sem URLs próprias.

## Demonstração alternativa

`npm run dev:demo` abre http://localhost:3002 com dados fictícios em memória. Esse modo serve para explorar a interface, mas não comprova persistência no PostgreSQL. Para apresentar o sistema integrado, use a porta 3000.

## Verificações já realizadas

Consulte `validacao-local.md` para os testes de frontend, build, revisão de mouse/teclado e integração com o banco real. Faça o ensaio manual completo no computador que será usado na apresentação.

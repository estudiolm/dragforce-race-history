/* =========================================================
   DRAGFORCE · USUÁRIOS DA EQUIPE (login simplificado)
   Lista fixa de usuário/senha, definida aqui no código — sem cadastro
   público, sem e-mail, sem precisar mexer no painel do Supabase para
   adicionar ou remover alguém.

   Para adicionar/remover uma pessoa: edite a lista abaixo e publique de
   novo (GitHub Desktop: commit + push). "role" hoje não muda o que a
   pessoa pode fazer no sistema (todo mundo que entra tem acesso total) —
   é só um rótulo, guardado para o dia em que quisermos diferenciar
   permissões (ex.: alguém que só vê, sem poder editar).

   ⚠️ Atenção: como o site é público, qualquer pessoa que abrir o
   código-fonte da página consegue ler as senhas abaixo. Não são o
   mesmo tipo de proteção de um login com senha guardada criptografada
   no servidor — é uma trava simples pensada para uma equipe pequena e
   de confiança, não para dados sensíveis. Não reutilize aqui uma senha
   importante de outro lugar (e-mail, banco etc.).
   ========================================================= */

window.DF_USERS = [
  { username: 'leandro', password: 'l1234', name: 'Leandro', role: 'admin' },
  { username: 'fernando', password: 'admin123456', name: 'Fernando', role: 'admin' },
];

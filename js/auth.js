/* =========================================================
   DRAGFORCE · AUTENTICAÇÃO
   Login simplificado por usuário/senha (lista fixa em js/users.js),
   sem e-mail. Por trás dos panos, ao validar o usuário/senha o sistema
   abre uma sessão real no Supabase usando uma conta técnica única
   (DF_CONFIG.serviceAuthEmail/serviceAuthPassword) — é isso que mantém
   as regras de segurança do banco (RLS) funcionando; a lista de "quem
   é quem" (nome, cargo) fica só no navegador (localStorage), separada
   da sessão do Supabase em si.

   Só faz algo de verdade quando DF.mode === 'supabase'. No modo local
   (sem Supabase configurado) o app inteiro é aberto, sem guarda de rota
   — o login vira só a tela visual, como antes.
   ========================================================= */

var DF = window.DF || {};

const DF_LOCAL_USER_KEY = 'df_current_user';

function findLocalUser(username, password) {
  const list = window.DF_USERS || [];
  const u = (username || '').trim().toLowerCase();
  return list.find((x) => x.username.toLowerCase() === u && x.password === password) || null;
}

DF.auth = {
  async getUser() {
    if (DF.mode !== 'supabase') return null;
    const stored = localStorage.getItem(DF_LOCAL_USER_KEY);
    if (!stored) return null;
    try {
      const { data } = await DF.supabaseClient().auth.getUser();
      if (!data || !data.user) { localStorage.removeItem(DF_LOCAL_USER_KEY); return null; }
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(DF_LOCAL_USER_KEY);
      return null;
    }
  },

  async signIn(username, password) {
    const match = findLocalUser(username, password);
    if (!match) throw new Error('Usuário ou senha incorretos.');

    const cfg = window.DF_CONFIG || {};
    const { error } = await DF.supabaseClient().auth.signInWithPassword({
      email: cfg.serviceAuthEmail,
      password: cfg.serviceAuthPassword,
    });
    if (error) throw new Error('Não foi possível conectar ao sistema agora. Tente novamente em instantes.');

    const sessionUser = { username: match.username, name: match.name, role: match.role };
    localStorage.setItem(DF_LOCAL_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  async signOut() {
    localStorage.removeItem(DF_LOCAL_USER_KEY);
    await DF.supabaseClient().auth.signOut();
  },
};

window.DF = DF;

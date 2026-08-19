/* =========================================================
   DRAGFORCE · AUTENTICAÇÃO
   Só faz algo de verdade quando DF.mode === 'supabase'. No modo local
   (sem Supabase configurado) o app inteiro é aberto, sem guarda de rota
   — o login vira só a tela visual, como antes.
   ========================================================= */

var DF = window.DF || {};

DF.auth = {
  async getUser() {
    if (DF.mode !== 'supabase') return null;
    const { data } = await DF.supabaseClient().auth.getUser();
    return data ? data.user : null;
  },

  async signIn(email, password) {
    const { data, error } = await DF.supabaseClient().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
    return data.user;
  },

  async signOut() {
    await DF.supabaseClient().auth.signOut();
  },
};

window.DF = DF;

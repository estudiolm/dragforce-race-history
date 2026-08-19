/* =========================================================
   DRAGFORCE · CONFIGURAÇÃO DO BACKEND
   Já preenchido com o projeto Supabase "dragforce-race-history"
   (criado em 2026-08-19, org. LmEstudioBase) — o sistema já roda em
   modo Supabase (login real + dados na nuvem). Ver GUIA-GITHUB-SUPABASE.md.

   Se algum dia quiser voltar ao modo local (dados só no navegador, sem
   login real), é só deixar os dois valores abaixo em branco ('').

   A "anon key" é feita para ficar no código do navegador (é pública por
   design); quem protege os dados de verdade são as políticas de RLS
   definidas em supabase/schema.sql (só usuário autenticado lê/escreve).
   ========================================================= */

window.DF_CONFIG = {
  supabaseUrl: 'https://vajqdzkoqlazvaxsedzk.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhanFkemtvcWxhenZheHNlZHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTAsImV4cCI6MjEwMjc0MjI1MH0.A8kaXGk7Lnpt9cnJZxQvZdO6pcMr3Z_tUsbUOHMSgro',
};

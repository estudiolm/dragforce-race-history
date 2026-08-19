/* =========================================================
   DRAGFORCE · PÁGINA SOBRE
   ========================================================= */

var DF = window.DF || {};
DF.pages = DF.pages || {};

DF.pages.about = {
  async render(root) {
    root.innerHTML = `
      <div class="page--narrow" style="margin:0 auto">
        <div class="about-hero">
          <img class="about-hero__emblem" src="assets/logos/dragforce-emblem.png" alt="DragForce Motorsport" />
          <img class="brand-logo" style="margin-top:var(--space-4)" src="assets/logos/dragforce-motorsport.png" alt="DragForce Motorsport" />
          <div class="eyebrow" style="margin-top:var(--space-4)">Sobre a plataforma</div>
          <h1 class="page-title" style="margin-top:8px">A ficha digital da sua equipe</h1>
          <p>O DragForce Race History centraliza carros, eventos, passadas e inspeções da equipe em um único lugar — com o mesmo rigor de dados de uma equipe profissional de competição.</p>
        </div>

        <div class="about-grid">
          <div class="about-card">
            <img class="brand-logo" src="assets/logos/dragforce-motorsport.png" alt="DragForce Motorsport" />
            <h3>DragForce</h3>
            <p>Marca e identidade do sistema de gestão de competição da equipe: garagem, histórico de eventos, evolução de tempos e inspeções técnicas, tudo em uma ficha digital por carro.</p>
          </div>
          <div class="about-card">
            <img src="assets/logos/boostclub-logo.png" alt="Boost Club" />
            <h3>Boost Club</h3>
            <p>Responsável pelo desenvolvimento e pela tecnologia por trás da plataforma DragForce Race History — do design de interface à engenharia de dados.</p>
          </div>
        </div>

        <div class="divider"></div>

        <div style="text-align:center;padding-bottom:var(--space-6)">
          <div class="eyebrow" style="margin-bottom:10px">Versão</div>
          <p class="mono" style="color:var(--text-secondary)">DragForce Race History · v1.0</p>
          <div class="app-footer__powered" style="display:inline-flex;margin-top:var(--space-5)">
            <span>Powered by</span>
            <img src="assets/logos/boostclub-logo.png" alt="Boost Club" />
          </div>
        </div>
      </div>
    `;
  },
};

window.DF = DF;

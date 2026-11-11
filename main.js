import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config.js";

const app = document.querySelector("#app");
const ready = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const supabase = ready ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
let session = null;
let cases = [];
let page = "home";
let notice = "";
let visitor = null;
let cameraState = { "Portail":"active", "Hall":"active", "Couloir nord":"active", "Archives":"active" };
let cameraRefresh = 0;

const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateLabel = (d = new Date()) => new Intl.DateTimeFormat("fr-FR", { day:"2-digit", month:"short" }).format(new Date(d));
const statusLabel = s => ({open:"En cours", review:"À analyser", closed:"Terminé"}[s] || s);

function render() {
  if (!ready) return renderSetup();
  if (!session) return renderLogin();
  const active = cases.filter(c => c.status !== "closed");
  const closed = cases.filter(c => c.status === "closed");
  app.innerHTML = `<div class="layout">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">P</span><div><b>P.D.E.</b><small>Palais des Enquêtes</small></div></div>
      <nav>${navItem("home","⌂","Accueil")}${navItem("cases","▤","Dossiers")}${navItem("appointments","◷","Rendez-vous")}${navItem("intercom","⌁","Interphone")}${navItem("cameras","▧","Caméras")}${navItem("archives","▣","Archives")}</nav>
      <div class="sidebar-bottom"><div class="identity"><span class="avatar">CL</span><div><b>Camille Lou</b><small>Directrice</small></div></div><button class="text-button" id="signout">Se déconnecter</button></div>
    </aside>
    <section class="workspace"><header class="topbar"><span>ESPACE DE DIRECTION</span><span class="cloud-state"><i></i> Sauvegarde en ligne activée</span></header>
      <div class="content">${notice ? `<div class="notice">${esc(notice)}<button id="close-notice" aria-label="Fermer">×</button></div>` : ""}${pageContent(active, closed)}</div>
    </section></div>`;
  bind();
}
function navItem(id, icon, label) { return `<button class="nav-item ${page===id?"selected":""}" data-page="${id}"><span>${icon}</span>${label}</button>`; }
function renderSetup() {
  app.innerHTML = `<section class="setup-screen"><div class="setup-card"><div class="brand centered"><span class="brand-mark">P</span><div><b>P.D.E.</b><small>Palais des Enquêtes</small></div></div><p class="eyebrow">BIENVENUE AU BUREAU</p><h1>Préparons ton espace sécurisé.</h1><p class="muted">La maquette est prête. Pour que tes dossiers soient bien synchronisés entre ton Mac et ton iPad, il faut maintenant relier une base de données en ligne à ton compte.</p><div class="setup-steps"><div><b>01</b><span>Créer l’espace cloud du P.D.E.</span></div><div><b>02</b><span>Activer la connexion par mot de passe</span></div><div><b>03</b><span>Retrouver les mêmes dossiers sur tes appareils</span></div></div><p class="setup-foot">Aucun dossier ne sera stocké uniquement sur cet appareil. La synchronisation sera active après le branchement du compte cloud.</p></div></section>`;
}
function renderLogin() {
  app.innerHTML = `<section class="login-screen"><form class="login-card" id="login-form"><div class="brand centered"><span class="brand-mark">P</span><div><b>P.D.E.</b><small>Palais des Enquêtes</small></div></div><p class="eyebrow">ESPACE DE DIRECTION</p><h1>Ravie de vous revoir, Camille.</h1><p class="muted">Connecte-toi pour retrouver les dossiers du bureau.</p><label>Adresse e-mail<input name="email" type="email" autocomplete="username" placeholder="camille@pde.fr" required /></label><label>Mot de passe<input name="password" type="password" autocomplete="current-password" placeholder="••••••••••" required /></label><button class="primary full" type="submit">Se connecter</button><p class="login-note">Connexion privée · données synchronisées</p>${notice?`<p class="error">${esc(notice)}</p>`:""}</form></section>`;
  document.querySelector("#login-form").addEventListener("submit", login);
}
function pageContent(active, closed) {
  if (page === "cases" || page === "archives") return casesPage(page === "archives" ? closed : active, page === "archives");
  if (page === "appointments") return `<p class="eyebrow">ORGANISATION</p><h1>Rendez-vous</h1><div class="empty-card"><div class="empty-icon">◷</div><h2>Ton agenda du P.D.E.</h2><p>La rubrique rendez-vous est prête à accueillir tes entretiens et rappels.</p></div>`;
  if (page === "intercom") return intercomPage();
  if (page === "cameras") return camerasPage();
  return `<p class="eyebrow">MARDI 11 NOVEMBRE</p><h1>Bonjour, Camille</h1><p class="muted intro">Le bureau du Palais des Enquêtes est à toi.</p><div class="stats"><article><span>DOSSIERS ACTIFS</span><strong>${String(active.length).padStart(2,"0")}</strong><small>Enquêtes en cours</small></article><article><span>RENDEZ-VOUS</span><strong>—</strong><small>Agenda à compléter</small></article><article class="highlight"><span>ACCUEIL</span><strong>Prêt</strong><small>Interphone simulé</small></article></div><div class="section-heading"><h2>Dossiers à suivre</h2><button class="text-button" data-page="cases">Voir tous →</button></div>${active.length ? `<div class="case-list">${active.slice(0,4).map(caseRow).join("")}</div>` : `<div class="empty-card compact"><p>Aucun dossier en cours pour le moment.</p><button class="primary" id="new-case-top">Créer un dossier</button></div>`}<div class="handover"><span>✦</span><p><b>Reprise de direction</b><br/>Camille Lou est la directrice actuelle. Les nouveaux dossiers porteront sa signature.</p></div>`;
}
function casesPage(list, archived) {
  return `<div class="page-title-row"><div><p class="eyebrow">${archived?"HISTORIQUE":"SUIVI DES ENQUÊTES"}</p><h1>${archived?"Archives":"Dossiers"}</h1></div>${!archived?`<button class="primary" id="new-case">＋ Nouveau dossier</button>`:""}</div>${list.length?`<div class="case-list">${list.map(caseRow).join("")}</div>`:`<div class="empty-card"><div class="empty-icon">▤</div><h2>${archived?"Aucun dossier terminé":"Prêt à ouvrir ta première enquête ?"}</h2><p>${archived?"Les dossiers clôturés apparaîtront ici.":"Crée un dossier pour commencer à consigner les étapes de l’enquête."}</p>${!archived?`<button class="primary" id="new-case-empty">Créer un dossier</button>`:""}</div>`}`;
}
function caseRow(c) {
  return `<button class="case-row" data-open="${c.id}"><span class="case-dot ${esc(c.status)}"></span><span class="case-info"><b>${esc(c.case_number || "PDE-…")} · ${esc(c.title)}</b><small>${esc(c.people || "Personnes à préciser")} · Mis à jour ${dateLabel(c.updated_at)}</small></span><span class="status ${esc(c.status)}">${statusLabel(c.status)}</span><span class="chevron">›</span></button>`;
}
function bind() {
  document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => { page=b.dataset.page; notice=""; render(); }));
  document.querySelector("#signout")?.addEventListener("click", async () => { await supabase.auth.signOut(); session=null; render(); });
  document.querySelector("#new-case")?.addEventListener("click", openNewCase);
  document.querySelector("#new-case-empty")?.addEventListener("click", openNewCase);
  document.querySelector("#new-case-top")?.addEventListener("click", openNewCase);
  document.querySelector("#close-notice")?.addEventListener("click", () => { notice=""; render(); });
  document.querySelector("#demo-ring")?.addEventListener("click", ringIntercom);
  document.querySelectorAll("[data-door]").forEach(b => b.addEventListener("click", () => answerIntercom(b.dataset.door)));
  document.querySelectorAll("[data-camera-toggle]").forEach(b => b.addEventListener("click", () => toggleCamera(b.dataset.cameraToggle)));
  document.querySelector("#camera-refresh")?.addEventListener("click", () => { cameraRefresh++; notice="Les vues simulées viennent d’être actualisées."; render(); });
  document.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openCase(b.dataset.open)));
}
async function login(event) {
  event.preventDefault(); const form = new FormData(event.currentTarget);
  const { error } = await supabase.auth.signInWithPassword({ email:form.get("email"), password:form.get("password") });
  if (error) { notice="Connexion impossible. Vérifie ton adresse et ton mot de passe."; renderLogin(); }
}
function intercomPage() {
  return `<p class="eyebrow">ACCUEIL DU PALAIS</p><h1>Interphone</h1><p class="muted intro">Accueil simulé du bâtiment · choisis qui peut entrer.</p><div class="intercom-card"><div class="camera-scene"><span class="camera-label">ENTRÉE PRINCIPALE · SIMULATION</span><div class="door"><div class="door-knob"></div></div><span class="door-state ${visitor?"ringing":""}">${visitor?"APPEL EN COURS":"PORTE FERMÉE"}</span></div><div class="visitor"><span class="visitor-icon">⌁</span><p class="eyebrow">${visitor?"VISITEUR À L’ENTRÉE":"INTERPHONE EN ATTENTE"}</p><h2>${visitor?esc(visitor.name):"Le hall est calme."}</h2><p>${visitor?esc(visitor.reason):"Lance une sonnerie fictive pour répondre au visiteur et choisir si tu lui ouvres."}</p>${visitor?`<div class="door-actions"><button class="primary" data-door="open">Ouvrir la porte</button><button class="secondary" data-door="decline">Refuser l’accès</button></div>`:`<button class="primary" id="demo-ring">Simuler une sonnerie</button>`}</div></div><div class="sim-note">Cette fonction joue une scène fictive. Elle ne commande aucune vraie porte ni interphone.</div>`;
}
function ringIntercom() {
  const arrivals=[{name:"Élise Martin",reason:"Rendez-vous avec la direction · Salle Saphir"},{name:"Madame Dajo",reason:"Demande de nouvelles au sujet de Lorençe"},{name:"Un coursier",reason:"Dépôt d'une enveloppe pour le bureau"}];
  visitor=arrivals[Math.floor(Math.random()*arrivals.length)]; notice="Ding dong… un visiteur sonne à l’entrée."; render();
}
function answerIntercom(choice) {
  const name=visitor?.name||"Le visiteur";
  notice=choice==="open"?`${name} est autorisé·e à entrer. La porte du hall est ouverte.`:`Accès refusé à ${name}. La porte reste fermée.`;
  visitor=null; render();
}
function camerasPage() {
  const views=[{name:"Portail",className:"gate",desc:"Entrée principale"},{name:"Hall",className:"lobby",desc:"Hall d’accueil"},{name:"Couloir nord",className:"corridor",desc:"Aile des bureaux"},{name:"Archives",className:"archive",desc:"Salle des archives"}];
  return `<div class="page-title-row"><div><p class="eyebrow">SÉCURITÉ DU PALAIS</p><h1>Caméras</h1></div><button class="secondary" id="camera-refresh">↻ Actualiser les vues</button></div><div class="camera-disclaimer">Flux entièrement simulés pour le jeu — aucune caméra réelle n’est connectée.</div><div class="camera-grid">${views.map((v,i)=>`<article class="camera-card"><div class="feed ${v.className} ${cameraState[v.name]==="active"?"":"feed-off"}"><span class="camera-label">CAM 0${i+1} · ${esc(v.name.toUpperCase())}</span>${cameraState[v.name]==="active"?`<span class="rec-dot">● SIMULATION</span><span class="feed-scene">${i===cameraRefresh%4?"Mouvement détecté":"Vue calme"}</span>`:`<span class="feed-scene">Vue désactivée</span>`}<time>${new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit"}).format(new Date())}</time></div><div class="camera-meta"><div><b>${esc(v.name)}</b><small>${esc(v.desc)}</small></div><button class="secondary small" data-camera-toggle="${esc(v.name)}">${cameraState[v.name]==="active"?"Désactiver":"Activer"}</button></div></article>`).join("")}</div>`;
}
function toggleCamera(name) { cameraState[name]=cameraState[name]==="active"?"off":"active"; notice=`Caméra ${name} ${cameraState[name]==="active"?"activée":"désactivée"} (simulation).`; render(); }
function openNewCase() {
  const modal = document.createElement("dialog"); modal.className="modal";
  modal.innerHTML=`<form method="dialog" id="case-form"><button class="modal-close" value="cancel" aria-label="Fermer">×</button><p class="eyebrow">NOUVELLE ENQUÊTE</p><h2>Ouvrir un dossier</h2><label>Nom du dossier<input name="title" placeholder="Ex. Affaire Tomaso" required maxlength="100" /></label><label>Personnes concernées<input name="people" placeholder="Noms des personnes" maxlength="240" /></label><label>Première note<textarea name="note" rows="3" placeholder="Contexte ou motif de l'enquête"></textarea></label><button class="primary full" type="submit">Enregistrer dans le cloud</button></form>`;
  document.body.append(modal); modal.showModal(); modal.querySelector("input").focus();
  modal.querySelector("form").addEventListener("submit", async e => { e.preventDefault(); const f=new FormData(e.currentTarget); const title=String(f.get("title")).trim(); const n=cases.length+1; const row={title,people:String(f.get("people")||"").trim(),note:String(f.get("note")||"").trim(),status:"open",case_number:`PDE-${String(n).padStart(3,"0")}`,created_by:session.user.id,updated_at:new Date().toISOString()}; const {error}=await supabase.from("cases").insert(row); if(error){ notice="Le dossier n’a pas pu être enregistré. Vérifie la connexion au cloud."; } else { notice="Dossier enregistré et synchronisé."; await loadCases(); } modal.close(); modal.remove(); render(); });
}
async function openCase(id) {
  const c=cases.find(item=>item.id===id); if(!c)return;
  const {data:updates=[]}=await supabase.from("case_updates").select("body,created_at").eq("case_id",c.id).order("created_at",{ascending:false});
  const modal=document.createElement("dialog"); modal.className="modal";
  modal.innerHTML=`<form method="dialog" id="update-form"><button class="modal-close" value="cancel" aria-label="Fermer">×</button><p class="eyebrow">${esc(c.case_number)} · ${statusLabel(c.status).toUpperCase()}</p><h2>${esc(c.title)}</h2><p class="muted">${esc(c.people||"Personnes à préciser")}</p>${c.note?`<div class="note-box">${esc(c.note)}</div>`:""}${updates.length?`<div class="timeline">${updates.map(u=>`<article><time>${dateLabel(u.created_at)}</time><p>${esc(u.body)}</p></article>`).join("")}</div>`:""}<label>Ajouter une avancée<textarea name="update" rows="3" placeholder="Consigne une nouvelle étape…" required></textarea></label><label>Statut<select name="status"><option value="open" ${c.status==="open"?"selected":""}>En cours</option><option value="review" ${c.status==="review"?"selected":""}>À analyser</option><option value="closed" ${c.status==="closed"?"selected":""}>Terminé</option></select></label><button class="primary full" type="submit">Enregistrer la mise à jour</button><button class="danger full" type="button" id="delete-case">Supprimer ce dossier</button><small class="privacy-note">Chaque mise à jour est ajoutée à l’historique du dossier.</small></form>`;
  document.body.append(modal); modal.showModal();
  modal.querySelector("form").addEventListener("submit", async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const entry={body:String(f.get("update")).trim(),status:String(f.get("status")),created_by:session.user.id};const {error}=await supabase.from("case_updates").insert({case_id:c.id,...entry});if(!error)await supabase.from("cases").update({status:entry.status,updated_at:new Date().toISOString()}).eq("id",c.id);if(error){notice="La mise à jour n’a pas pu être enregistrée.";}else{notice="Mise à jour synchronisée.";await loadCases();}modal.close();modal.remove();render();});
  modal.querySelector("#delete-case").addEventListener("click",()=>{
    const confirmDialog=document.createElement("dialog");confirmDialog.className="modal delete-confirm";
    confirmDialog.innerHTML=`<p class="eyebrow">CONFIRMATION POUR CE DOSSIER</p><h2>Supprimer ${esc(c.case_number)} · ${esc(c.title)} ?</h2><p class="delete-summary">Cette action supprimera ce dossier ainsi que toutes ses avancées et son historique. Elle est définitive.</p><div class="delete-detail"><b>Dossier concerné</b><span>${esc(c.title)}</span><small>${esc(c.case_number)} · ${statusLabel(c.status)}</small></div><p class="delete-instruction">Pour confirmer, appuie sur <b>« Oui, supprimer ce dossier »</b>. Sinon, choisis « Annuler » : rien ne sera supprimé.</p><p class="error delete-error" hidden></p><div class="delete-actions"><button class="secondary" type="button" id="cancel-delete">Annuler</button><button class="danger" type="button" id="confirm-delete">Oui, supprimer ce dossier</button></div>`;
    confirmDialog.addEventListener("close",()=>confirmDialog.remove(),{once:true});document.body.append(confirmDialog);confirmDialog.showModal();
    confirmDialog.querySelector("#cancel-delete").addEventListener("click",()=>{confirmDialog.close();confirmDialog.remove();});
    confirmDialog.querySelector("#confirm-delete").addEventListener("click",async()=>{
      const button=confirmDialog.querySelector("#confirm-delete");button.disabled=true;button.textContent="Suppression…";
      const {error}=await supabase.from("cases").delete().eq("id",c.id);
      if(error){const message=confirmDialog.querySelector(".delete-error");message.hidden=false;message.textContent="La suppression a échoué. Vérifie les règles d’accès Supabase puis réessaie.";button.disabled=false;button.textContent="Oui, supprimer ce dossier";return;}
      confirmDialog.close();confirmDialog.remove();modal.close();modal.remove();notice=`${c.case_number} · ${c.title} et son historique ont été supprimés.`;await loadCases();render();
    });
  });
}
async function loadCases() {
  const {data,error}=await supabase.from("cases").select("*").order("updated_at",{ascending:false});
  if(error){notice="Impossible de récupérer les dossiers. Vérifie la connexion cloud.";return;}
  cases=data||[];
}
async function init() {
  if(!ready){render();return;}
  const {data}=await supabase.auth.getSession(); session=data.session;
  supabase.auth.onAuthStateChange(async (_event,next)=>{session=next;if(session){await loadCases();}else{cases=[];}render();});
  if(session)await loadCases(); render();
  if(session) supabase.channel("cases-sync").on("postgres_changes",{event:"*",schema:"public",table:"cases",filter:`created_by=eq.${session.user.id}`},async()=>{await loadCases();render();}).on("postgres_changes",{event:"INSERT",schema:"public",table:"case_updates",filter:`created_by=eq.${session.user.id}`},async()=>{await loadCases();render();}).subscribe();
}
init();

#!/usr/bin/env node
// Génère les pages thème, le hub, le comparatif et le sitemap à partir de data/*.json.
// Node 22, zéro dépendance. Relançable : chaque lancement réécrit les mêmes fichiers.
//   node scripts/build-pages.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://thepunchlines.app';
const HUB = 'affirmations-positives';

const data = JSON.parse(readFileSync(join(RACINE, 'data/themes.json'), 'utf8'));
const comp = JSON.parse(readFileSync(join(RACINE, 'data/comparatif.json'), 'utf8'));
const LASTMOD = data.lastmod;

const themes = data.themes;
const parSlug = Object.fromEntries(themes.map((t) => [t.slug, t]));
const alertes = [];

// ---------- Outils texte ----------

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Typographie française : apostrophe courbe, espace fine insécable avant ? ! ; et insécable avant :
function typo(s) {
  return String(s)
    .replace(/'/g, '\u2019')
    .replace(/« ?/g, '«\u00a0')
    .replace(/ ?»/g, '\u00a0»')
    .replace(/ ([?!;])/g, '\u202f$1')
    .replace(/ :/g, '\u00a0:')
    .replace(/(\d) (\d{3})\b/g, '$1\u202f$2')
    .replace(/(\d) (phrases|notes)\b/g, '$1\u00a0$2')
    .replace(/(\d) €/g, '$1\u00a0€');
}
const t = (s) => esc(typo(s));

const n = (gabarit, nombre) => gabarit.replace('{n}', String(nombre));

const urlTheme = (slug) => `/${HUB}/${slug}/`;
const urlHub = `/${HUB}/`;
const urlComp = `/${comp.slug}/`;

function ecrire(chemin, contenu) {
  const complet = join(RACINE, chemin);
  mkdirSync(dirname(complet), { recursive: true });
  writeFileSync(complet, contenu);
}

// ---------- Morceaux communs ----------

const SVG_APPLE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.033 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-.702"/></svg>`;
const SVG_PLAY = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.61 1.814 13.79 12 3.61 22.186a2.05 2.05 0 0 1-.567-1.42V3.234c0-.547.213-1.05.567-1.42zm11.13 11.136 2.588 2.588-11.61 6.573c-.44.25-.94.31-1.4.19l10.422-9.351zm3.446-4.033 3.07 1.738c.65.368 1.05 1.05 1.05 1.795 0 .744-.4 1.427-1.05 1.795l-3.07 1.738L15.69 12l2.496-2.917zM4.318 1.7c.46-.12.96-.06 1.4.19l11.61 6.573-2.588 2.588L4.318 1.7z"/></svg>`;

function boutons(campagne) {
  const apple = `https://apps.apple.com/app/apple-store/id6744821000?pt=125279170&ct=${campagne}&mt=8`;
  const play = `https://play.google.com/store/apps/details?id=fr.harryjmg.punchlines&referrer=utm_source%3Dsite%26utm_campaign%3D${campagne}`;
  return `<div class="ctas">
      <a class="cta" href="${esc(apple)}">
        ${SVG_APPLE}
        <span><small>Télécharger sur</small><b>l\u2019App Store</b></span>
      </a>
      <a class="cta" href="${esc(play)}">
        ${SVG_PLAY}
        <span><small>Disponible sur</small><b>Google Play</b></span>
      </a>
    </div>`;
}

function blocApp(campagne, phrase) {
  return `<aside class="app" aria-label="Télécharger l\u2019app Punchlines">
    <p>${phrase}</p>
    ${boutons(campagne)}
  </aside>`;
}

const ANALYTICS = `<!-- Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NBPSYKCB7E"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-NBPSYKCB7E');
</script>
<script defer data-domain="thepunchlines.app" src="https://plausible.io/js/script.js"></script>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PZLPRC5B');</script>
<script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '597114786828376');
    fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=597114786828376&ev=PageView&noscript=1"
    alt=""/></noscript>`;

function jsonld(obj) {
  // </ ne doit jamais apparaître dans un script
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

function fil(etapes) {
  // etapes : [{nom, url}] ; la dernière est la page courante
  const html = `<nav class="ariane" aria-label="Fil d\u2019Ariane"><ol>${etapes
    .map((e, i) =>
      i === etapes.length - 1
        ? `<li aria-current="page">${t(e.nom)}</li>`
        : `<li><a href="${esc(e.url)}">${t(e.nom)}</a></li>`,
    )
    .join('')}</ol></nav>`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: etapes.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: typo(e.nom),
      item: SITE + e.url,
    })),
  };
  return { html, ld };
}

function page({ chemin, titre, description, jsonlds, corps }) {
  if (titre.length > 65) alertes.push(`title de ${chemin} : ${titre.length} caractères`);
  if (description.length > 165) alertes.push(`description de ${chemin} : ${description.length} caractères`);
  const canonical = SITE + chemin;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t(titre)}</title>
<meta name="description" content="${t(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#F7F7F2">
<meta name="apple-itunes-app" content="app-id=6744821000">

<meta property="og:type" content="article">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Punchlines">
<meta property="og:title" content="${t(titre)}">
<meta property="og:description" content="${t(description)}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t(titre)}">
<meta name="twitter:description" content="${t(description)}">
<meta name="twitter:image" content="${SITE}/assets/og.png">

<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png">
<link rel="manifest" href="/assets/favicon/site.webmanifest">
<link rel="shortcut icon" href="/assets/favicon/favicon.ico">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@700&family=Epilogue:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/pages.css">

${ANALYTICS}

${jsonlds.map(jsonld).join('\n')}
</head>
<body>
<div class="halo" aria-hidden="true"></div>

<header class="entete">
  <a class="marque" href="/"><img src="/assets/app-icon.png" alt="" width="36" height="36">Punchlines</a>
</header>

<main>
${corps}
</main>

<footer>
  <nav class="liens" aria-label="Liens du site">
    <a href="${urlHub}">Affirmations positives</a>
    <a href="/support.html">Support</a>
    <a href="/privacy.html">Confidentialité</a>
    <a href="/terms.html">Conditions</a>
    <a href="/delete-data.html">Supprimer mes données</a>
  </nav>
  <p class="mentions">
    <a href="mailto:harry@thepunchlines.app">harry@thepunchlines.app</a>
    <span class="point">·</span>
    <span class="u">©&nbsp;2026 Punchlines</span>
  </p>
</footer>
</body>
</html>
`;
}

const PHRASE_APP = 'L\u2019app Punchlines t\u2019envoie chaque jour des phrases choisies pour toi, selon ce que tu traverses. Sur iPhone et Android.';
const PHRASE_RAPPEL = '<strong>Envie d\u2019en recevoir une chaque jour\u202f?</strong> Télécharge Punchlines, l\u2019app d\u2019affirmations positives.';

// ---------- Pages thème ----------

for (const th of themes) {
  const nb = th.phrases.length;
  const chemin = urlTheme(th.slug);
  const titre = n(th.title, nb);
  const description = n(th.description, nb);
  const campagne = `seo-${th.slug}`;

  const ariane = fil([
    { nom: 'Accueil', url: '/' },
    { nom: 'Affirmations positives', url: urlHub },
    { nom: th.name, url: chemin },
  ]);

  for (const r of th.related) if (!parSlug[r]) throw new Error(`Thème lié inconnu : ${r} (dans ${th.slug})`);
  const liens = [
    ...th.related.map((r) => ({ url: urlTheme(r), ancre: parSlug[r].anchor })),
    th.extra === 'comparatif'
      ? { url: urlComp, ancre: 'les meilleures applications d\u2019affirmations positives' }
      : { url: urlHub, ancre: 'toutes les affirmations positives par thème' },
  ];
  if (liens.length !== 5) throw new Error(`${th.slug} : ${liens.length} liens « À lire aussi » au lieu de 5`);
  const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const corps = `  ${ariane.html}

  <h1>${t(th.h1)}</h1>
  <div class="intro">
    ${th.intro.map((p) => `<p>${t(p)}</p>`).join('\n    ')}
  </div>

  <h2>Les ${nb} phrases</h2>
  <ol class="phrases">
    ${th.phrases.map((p) => `<li>${t(p)}</li>`).join('\n    ')}
  </ol>

  ${blocApp(campagne, PHRASE_APP)}

  <section class="texte">
    <h2>Comment t\u2019en servir</h2>
    <p>${t(th.howto)}</p>
  </section>

  <section>
    <h2>À lire aussi</h2>
    <ul class="a-lire">
      ${liens.map((l) => `<li><a href="${esc(l.url)}">${t(capital(l.ancre))}</a></li>`).join('\n      ')}
    </ul>
  </section>

  ${blocApp(campagne, PHRASE_RAPPEL)}`;

  ecrire(`${HUB}/${th.slug}/index.html`, page({ chemin, titre, description, jsonlds: [ariane.ld], corps }));
}

// ---------- Hub ----------

{
  const hub = data.hub;
  for (const p of hub.phrases) if (!parSlug[p.theme]) throw new Error(`Hub : thème inconnu ${p.theme}`);
  const nb = hub.phrases.length;
  const titre = n(hub.title, nb);
  const ariane = fil([
    { nom: 'Accueil', url: '/' },
    { nom: 'Affirmations positives', url: urlHub },
  ]);
  const corps = `  ${ariane.html}

  <h1>${t(hub.h1)}</h1>
  <div class="intro">
    ${hub.intro.map((p) => `<p>${t(p)}</p>`).join('\n    ')}
  </div>

  <h2>${nb} affirmations positives puissantes</h2>
  <ol class="phrases">
    ${hub.phrases
      .map(
        (p) =>
          `<li>${t(p.text)}<span class="source"><a href="${urlTheme(p.theme)}">${t(parSlug[p.theme].name)}</a></span></li>`,
      )
      .join('\n    ')}
  </ol>

  ${blocApp('seo-hub', PHRASE_APP)}

  <section>
    <h2>Les affirmations positives par thème</h2>
    <ul class="liens-themes">
      ${themes
        .map(
          (th) =>
            `<li><a href="${urlTheme(th.slug)}">${t(th.h1)}<span>${t(th.teaser)} ${th.phrases.length} phrases.</span></a></li>`,
        )
        .join('\n      ')}
    </ul>
  </section>

  <section class="texte">
    <h2>Comment t\u2019en servir</h2>
    <p>${t(hub.howto)}</p>
  </section>

  <section class="texte">
    <h2>Quelle application choisir\u202f?</h2>
    <p>Plusieurs apps envoient des affirmations positives chaque jour. On les a comparées, en disant pour qui chacune est faite : <a href="${urlComp}">les meilleures applications d\u2019affirmations positives en 2026</a>.</p>
  </section>

  ${blocApp('seo-hub', PHRASE_RAPPEL)}`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: typo(hub.h1),
    url: SITE + urlHub,
    inLanguage: 'fr',
    hasPart: themes.map((th) => ({ '@type': 'WebPage', name: typo(th.h1), url: SITE + urlTheme(th.slug) })),
  };
  ecrire(
    `${HUB}/index.html`,
    page({ chemin: urlHub, titre, description: hub.description, jsonlds: [ariane.ld, ld], corps }),
  );
}

// ---------- Comparatif ----------

{
  const ariane = fil([
    { nom: 'Accueil', url: '/' },
    { nom: comp.crumb, url: urlComp },
  ]);
  const NON_AFFICHE = 'non affiché sur la fiche';
  const vide = (s) => `<span class="vide">${t(s)}</span>`;
  const val = (s, repli = NON_AFFICHE) => (s ? t(s) : vide(repli));
  const oui = '<span class="oui">Oui</span>';

  for (const a of comp.apps) {
    for (const champ of ['slug', 'nom', 'editeur', 'logo', 'pourQui', 'ios', 'prix']) {
      if (!a[champ]) throw new Error(`Comparatif : ${a.nom || '?'} sans ${champ}`);
    }
    if (!a.ios.source || !a.ios.releve) throw new Error(`Comparatif : ${a.nom} sans source App Store datée`);
    if (a.android && (!a.android.source || !a.android.releve)) throw new Error(`Comparatif : ${a.nom} sans source Play datée`);
    if (!a.android && !a.androidAbsent) throw new Error(`Comparatif : ${a.nom} sans Android ni androidAbsent`);
  }

  const logo = (a, taille) =>
    `<img class="icone" src="${esc(a.logo)}" alt="${esc(typo(a.nom))}" width="${taille}" height="${taille}" loading="lazy" decoding="async">`;

  const lienApple = (a) =>
    a.notre
      ? `https://apps.apple.com/app/apple-store/id${a.ios.id}?pt=125279170&ct=seo-comparatif&mt=8`
      : a.ios.url;
  const lienPlay = (a) =>
    a.notre
      ? `https://play.google.com/store/apps/details?id=${a.android.package}&referrer=utm_source%3Dsite%26utm_campaign%3Dseo-comparatif`
      : a.android.url;
  const rel = (a) => (a.notre ? '' : ' rel="nofollow noopener"');

  const noteIos = (a) =>
    `<span class="note-val">${t(a.ios.note)}</span><span class="note-nb">${t(a.ios.nbNotes)} notes</span>`;
  const noteAndroid = (a) => {
    if (!a.android) return vide('pas sur Google Play');
    if (!a.android.note) return vide('pas de note affichée');
    return `<span class="note-val">${t(a.android.note)}</span><span class="note-nb">${t(a.android.nbAvis)} avis</span>`;
  };

  // ----- Tableau -----
  const lignes = comp.apps
    .map(
      (a) => `<tr${a.notre ? ' class="notre"' : ''}>
          <th scope="row"><a class="app-cell" href="#${esc(a.slug)}">${logo(a, 40)}<span><b>${t(a.nom)}</b>${a.notre ? '<em class="badge">Notre app</em>' : `<small>${t(a.editeur)}</small>`}</span></a></th>
          <td>${noteIos(a)}</td>
          <td>${noteAndroid(a)}</td>
          <td>${oui}</td>
          <td>${a.android ? oui : vide('Non trouvée')}</td>
          <td>${a.ios.francais ? oui : '<span class="non">Non, anglais</span>'}</td>
          <td>${val(a.prix.mensuel)}</td>
          <td>${val(a.prix.annuel)}</td>
          <td>${val(a.prix.essai)}</td>
        </tr>`,
    )
    .join('\n        ');

  // ----- Fiches -----
  const ligneDl = (terme, valeur) => `<div><dt>${t(terme)}</dt><dd>${valeur}</dd></div>`;

  const fiches = comp.apps
    .map((a) => {
      const prixIos = [
        ligneDl('Mensuel', val(a.prix.mensuel)),
        ligneDl('Annuel', val(a.prix.annuel)),
        ligneDl('À vie', val(a.prix.vie)),
        ligneDl('Essai gratuit', val(a.prix.essai)),
      ].join('');
      const android = a.android
        ? `<p class="prix-android"><strong>Android</strong> : achats de ${t(a.android.fourchette)} d’après Google Play. ${t(a.android.telechargements)} téléchargements${a.android.note ? `, note ${t(a.android.note)} sur 5 (${t(a.android.nbAvis)} avis)` : ''}.${a.android.pubs ? ' La fiche indique « Contient des annonces ».' : ''}</p>`
        : `<p class="prix-android"><strong>Android</strong> : ${t(a.androidAbsent)}</p>`;
      const achats = a.ios.achatsIntegres
        .map(([nom, prix]) => `<li><span>${esc(nom)}</span><span class="u">${t(prix)}</span></li>`)
        .join('');
      const boutonsApp = a.notre
        ? boutons('seo-comparatif')
        : `<div class="ctas ctas-fiche">
        <a class="cta cta-clair" href="${esc(lienApple(a))}"${rel(a)}>${SVG_APPLE}<span><small>Voir sur</small><b>l’App Store</b></span></a>
        ${a.android ? `<a class="cta cta-clair" href="${esc(lienPlay(a))}"${rel(a)}>${SVG_PLAY}<span><small>Voir sur</small><b>Google Play</b></span></a>` : ''}
      </div>`;
      return `<article class="fiche${a.notre ? ' fiche-notre' : ''}" id="${esc(a.slug)}">
      <header class="fiche-tete">
        ${logo(a, 64)}
        <div>
          <h3>${t(a.nom)}${a.notre ? ' <em class="badge">Notre app</em>' : ''}</h3>
          <p class="fiche-sous">${t(a.editeur)} · ${t(a.style)}</p>
        </div>
      </header>
      <p class="pour-qui">${t(a.pourQui)}</p>
      <div class="colonnes">
        <div>
          <h4>Points forts</h4>
          <ul class="puces puces-plus">${a.forts.map((f) => `<li>${t(f)}</li>`).join('')}</ul>
        </div>
        <div>
          <h4>Limites</h4>
          <ul class="puces puces-moins">${a.limites.map((f) => `<li>${t(f)}</li>`).join('')}</ul>
        </div>
      </div>
      <h4>Prix sur iPhone</h4>
      <dl class="prix">${prixIos}</dl>
      ${a.prix.autres ? `<p class="prix-autres">${t(a.prix.autres)}</p>` : ''}
      ${a.ios.noteMensuel ? `<p class="prix-autres">${t(a.ios.noteMensuel)}</p>` : ''}
      ${android}
      <details class="achats">
        <summary>Les ${a.ios.achatsIntegres.length} achats intégrés affichés sur l’App Store</summary>
        <ul>${achats}</ul>
        <p>Langue de l’app : ${t(a.ios.langues)}. Apple Watch : ${a.ios.appleWatch ? 'oui' : 'non'}. Source : <a href="${esc(a.ios.source)}"${rel(a)}>fiche App Store</a>${a.android ? `, <a href="${esc(a.android.source)}"${rel(a)}>fiche Google Play</a>` : ''}, relevé le ${t(comp.dateReleve)}.</p>
      </details>
      ${boutonsApp}
    </article>`;
    })
    .join('\n    ');

  for (const s of comp.liensThemes) if (!parSlug[s]) throw new Error(`Comparatif : thème inconnu ${s}`);
  const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const corps = `  ${ariane.html}

  <h1>${t(comp.h1)}</h1>
  <p class="avertissement">${t(comp.avertissement)}</p>
  <div class="intro">
    ${comp.intro.map((p) => `<p>${t(p)}</p>`).join('\n    ')}
  </div>
  <p class="releve"><time datetime="${esc(comp.dateReleveIso)}">${t(comp.ligneReleve)}</time></p>

  <h2>Le tableau</h2>
  <div class="tableau-large">
    <div class="tableau-wrap" role="region" aria-label="Tableau comparatif des apps" tabindex="0">
      <table class="tableau">
        <thead>
          <tr><th scope="col">App</th><th scope="col">Note iOS</th><th scope="col">Note Android</th><th scope="col">iPhone</th><th scope="col">Android</th><th scope="col">En français</th><th scope="col">Prix mensuel</th><th scope="col">Prix annuel</th><th scope="col">Essai</th></tr>
        </thead>
        <tbody>
        ${lignes}
        </tbody>
      </table>
    </div>
    <p class="note-tableau">Notes sur 5. Prix iPhone, tels que nommés dans la liste des achats intégrés. Sur mobile, fais glisser le tableau.</p>
  </div>

  <h2>Chaque app en détail</h2>
  <div class="fiches">
    ${fiches}
  </div>

  <section class="texte">
    <h2>${t(comp.choisir.titre)}</h2>
    ${comp.choisir.paragraphes.map((p) => `<p>${t(p)}</p>`).join('\n    ')}
  </section>

  <section class="texte methode">
    <h2>Notre méthode</h2>
    ${comp.methode.map((p) => `<p>${t(p)}</p>`).join('\n    ')}
  </section>

  <section>
    <h2>Des affirmations positives à lire tout de suite</h2>
    <ul class="a-lire">
      ${comp.liensThemes.map((s) => `<li><a href="${urlTheme(s)}">${t(capital(parSlug[s].anchor))}</a></li>`).join('\n      ')}
    </ul>
  </section>

  ${blocApp('seo-comparatif', PHRASE_RAPPEL)}`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: typo(comp.title),
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: comp.apps.length,
    itemListElement: comp.apps.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: typo(a.nom),
      url: a.ios.url,
    })),
  };
  ecrire(
    `${comp.slug}/index.html`,
    page({ chemin: urlComp, titre: comp.title, description: comp.description, jsonlds: [ariane.ld, ld], corps }),
  );
}

// ---------- Sitemap ----------

{
  const urls = [
    { loc: '/', prio: '1.0' },
    { loc: urlHub, prio: '0.9' },
    ...themes.map((th) => ({ loc: urlTheme(th.slug), prio: '0.8' })),
    { loc: urlComp, prio: '0.7', lastmod: comp.lastmod },
    { loc: '/support.html', prio: '0.3' },
    { loc: '/privacy.html', prio: '0.2' },
    { loc: '/terms.html', prio: '0.2' },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${SITE}${u.loc}</loc>\n    <lastmod>${u.lastmod || LASTMOD}</lastmod>\n    <priority>${u.prio}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`;
  ecrire('sitemap.xml', xml);
}

// ---------- Bilan ----------

console.log(`Hub : ${data.hub.phrases.length} phrases`);
for (const th of themes) console.log(`${th.slug.padEnd(18)} ${String(th.phrases.length).padStart(2)} phrases  ${n(th.title, th.phrases.length)}`);
console.log(`Comparatif : ${comp.apps.length} apps`);
if (alertes.length) {
  console.log('\nÀ vérifier :');
  for (const a of alertes) console.log(' - ' + a);
}

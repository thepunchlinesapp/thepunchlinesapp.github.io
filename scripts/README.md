# Pages générées

```
node scripts/build-pages.mjs
```

Node 22, aucune dépendance. Le script lit `data/themes.json` et `data/comparatif.json`, puis réécrit :

- `affirmations-positives/index.html` (le hub)
- `affirmations-positives/<slug>/index.html` (une page par thème)
- `meilleures-applications-affirmations-positives/index.html` (le comparatif)
- `sitemap.xml`

Ne modifie pas ces fichiers à la main : change le JSON, puis relance le script. Il est relançable autant de fois que tu veux.

Le style est dans `css/pages.css`. Le titre de chaque page prend le vrai nombre de phrases (`{n}` dans `title` et `description`). Le script signale un titre de plus de 65 caractères ou une description de plus de 165.

Les phrases viennent du catalogue français de l'app, triées à la main (voir le champ `source` de `themes.json`). Pense à changer `lastmod` quand tu modifies les pages.

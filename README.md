# Carte Réseau — Carte météo des vents en Europe

Application web de visualisation des vents en temps réel sur l'Europe, construite avec **Next.js**, **MapLibre GL** et **deck.gl**.

## Fonctionnalités

- **Carte vectorielle** avec fond hillshade et frontières nationales (Protomaps)
- **Couche raster** colorée selon la vitesse du vent (échelle de Beaufort)
- **Particules animées** représentant la direction et l'intensité du vent
- **Données Météo-France** (API AROME haute résolution)
- **Cache serveur 3 heures** : le serveur récupère les données météo et les met en cache, les clients ne sollicitent plus directement l'API externe

## Architecture

```
src/
├── app/
│   ├── api/wind/route.ts   # Route API Next.js — fetch + cache 3h des données AROME
│   ├── page.tsx            # Page principale
│   └── layout.tsx
├── components/
│   ├── WindMap.tsx         # Carte interactive (MapLibre + deck.gl)
│   └── WindMapWrapper.tsx  # Chargement dynamique côté client
├── config/
│   └── mapConfig.ts        # Clés API, bornes géographiques, palette de couleurs
└── lib/wind/
    ├── UV_TIFF.ts          # Orchestration des appels WCS Météo-France
    ├── fetch.ts            # Requêtes HTTP vers l'API AROME
    ├── analyse.ts          # Parsing XML des capabilities WCS
    └── main.ts             # Conversion GeoTIFF → ImageData (texture vent)
```

## Palette de couleurs

La couche raster utilise une palette inspirée de l'échelle de Beaufort :

| Valeur normalisée | Couleur        | Description              |
|:-----------------:|:--------------:|:-------------------------|
| 0                 | blanc cassé    | Calme                    |
| 0.1 – 0.2         | vert-turquoise | Faible brise             |
| 0.3 – 0.4         | bleu vif/marine| Brise modérée/fraîche    |
| 0.5               | jaune          | Vent fort                |
| 0.6               | orange         | Grand vent               |
| 0.7               | rouge          | Tempête                  |
| 0.85 – 1.0        | violet         | Violente tempête         |

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Les clés API sont définies dans `src/config/mapConfig.ts` :

- `API_KEY_METEO` — clé Météo-France (API AROME WCS)
- `PROTOMAPS_API_KEY` — clé Protomaps (tuiles vectorielles)

## Déploiement

```bash
npm run build
npm start
```

Le serveur Next.js expose l'API `/api/wind` qui agit comme un proxy avec cache vers Météo-France. Il est recommandé de déployer avec un processus persistant (ex. systemd, PM2) pour bénéficier du cache en mémoire.

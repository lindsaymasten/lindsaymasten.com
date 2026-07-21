# Lindsay Masten

The source for [lindsaymasten.com](https://lindsaymasten.com), built with Laravel and Vite as a flat-file personal publication.

## Local development

Requirements: PHP 8.3 or newer, Composer, and Node.js 20 or newer.

```bash
composer install
cp .env.example .env
php artisan key:generate
npm install
npm run dev
```

Herd serves the project locally at `http://lindsaymasten.test`.

## Content model

- Page templates live in `resources/views`.
- The complete CV is maintained in `resources/content/cv.md` and rendered by Laravel on the `/cv` route.
- Editorial image fragments live in `public/images`.
- The visual system and responsive compositions live in `resources/css/app.css`.

The content is deliberately separated from the presentation so it can later move into a flat-file CMS or static publishing workflow without redesigning the site.

## Production

For a conventional VPS deployment, point the web root at `public`, set production values in `.env`, and run:

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

The public site does not require a database. Sessions and cache use the filesystem, and queued work runs synchronously.

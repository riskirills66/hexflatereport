# Web Report Admin Panel

Web report dan admin panel berbasis React.

## Prerequisites

- Node.js 18+
- npm atau yarn

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Buat file `.env` dari `.env.example`:

```bash
cp .env.example .env
```

3. Edit file `.env` dan isi dengan nilai yang sesuai:

```
VITE_API_ENDPOINTS=https://api.example.com
VITE_X_TOKEN_VALUE=anything_random_is_not_truely_random
VITE_WS_BACKEND_HOST=api.example.com
VITE_WEB_TITLE=AGEN PULS
VITE_WEB_FAVICON=https://vite.dev/logo.svg
```

4. Jalankan development server:

```bash
npm run dev
```

Web report akan tersedia di `http://localhost:4000`

## Build

```bash
npm run build
```

## Vercel Deployment

1. Import project di [Vercel](https://vercel.com)

2. Vercel akan otomatis mendeteksi:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Tambahkan Environment Variables** di Vercel:
   - Masuk ke Settings ? Environment Variables
   - Tambahkan semua variabel dari file `.env.example`:
     - `VITE_API_ENDPOINTS`
     - `VITE_X_TOKEN_VALUE`
     - `VITE_WS_BACKEND_HOST`
     - `VITE_WEB_TITLE`
     - `VITE_WEB_FAVICON`

4. Deploy - Vercel akan menangani sisanya secara otomatis

File `vercel.json` sudah dikonfigurasi untuk single-page application routing.

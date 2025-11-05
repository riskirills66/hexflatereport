interface ImportMetaEnv {
  readonly VITE_API_ENDPOINTS: string;
  readonly VITE_X_TOKEN_VALUE: string;
  readonly VITE_WS_BACKEND_HOST: string;
  readonly VITE_WEB_TITLE: string;
  readonly VITE_WEB_FAVICON: string;
  // add more VITE_ variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

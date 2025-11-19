interface MarkdownFile {
  filename: string;
  title: string;
  content: string;
  created_at?: string;
  modified_at?: string;
  size: number;
}

interface MarkdownFilesListResponse {
  success: boolean;
  files: MarkdownFile[];
}

interface MarkdownFileResponse {
  success: boolean;
  file: MarkdownFile;
}

interface FilesListCacheEntry {
  data: MarkdownFilesListResponse;
  timestamp: number;
}

interface FileContentCacheEntry {
  data: MarkdownFile;
  timestamp: number;
}

const FILES_LIST_CACHE_KEY = 'markdownFilesListCache';
const FILE_CONTENT_CACHE_KEY = 'markdownFileContentCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function getCachedMarkdownFiles(): MarkdownFile[] | null {
  try {
    const cached = localStorage.getItem(FILES_LIST_CACHE_KEY);
    if (!cached) return null;

    const entry: FilesListCacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(FILES_LIST_CACHE_KEY);
      return null;
    }

    return entry.data.files || null;
  } catch (error) {
    console.error('Error reading markdown files cache:', error);
    return null;
  }
}

export function setCachedMarkdownFiles(files: MarkdownFile[]): void {
  try {
    const entry: FilesListCacheEntry = {
      data: {
        success: true,
        files,
      },
      timestamp: Date.now(),
    };
    localStorage.setItem(FILES_LIST_CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing markdown files cache:', error);
  }
}

export function getCachedMarkdownFile(filename: string): MarkdownFile | null {
  try {
    const cached = localStorage.getItem(FILE_CONTENT_CACHE_KEY);
    if (!cached) return null;

    const cache: Record<string, FileContentCacheEntry> = JSON.parse(cached);
    const entry = cache[filename];

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_EXPIRY) {
      delete cache[filename];
      localStorage.setItem(FILE_CONTENT_CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading markdown file cache:', error);
    return null;
  }
}

export function setCachedMarkdownFile(filename: string, file: MarkdownFile): void {
  try {
    const cached = localStorage.getItem(FILE_CONTENT_CACHE_KEY);
    const cache: Record<string, FileContentCacheEntry> = cached ? JSON.parse(cached) : {};

    cache[filename] = {
      data: file,
      timestamp: Date.now(),
    };

    localStorage.setItem(FILE_CONTENT_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error writing markdown file cache:', error);
  }
}

export function clearMarkdownCache(): void {
  try {
    localStorage.removeItem(FILES_LIST_CACHE_KEY);
    localStorage.removeItem(FILE_CONTENT_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing markdown cache:', error);
  }
}

export function removeCachedMarkdownFile(filename: string): void {
  try {
    const cached = localStorage.getItem(FILE_CONTENT_CACHE_KEY);
    if (!cached) return;

    const cache: Record<string, FileContentCacheEntry> = JSON.parse(cached);
    delete cache[filename];
    localStorage.setItem(FILE_CONTENT_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error removing markdown file cache:', error);
  }
}

export function mergeMarkdownFiles(
  existing: MarkdownFile[],
  newFiles: MarkdownFile[]
): MarkdownFile[] {
  const existingMap = new Map(existing.map(f => [f.filename, f]));
  
  newFiles.forEach(file => {
    existingMap.set(file.filename, file);
  });

  return Array.from(existingMap.values());
}

export function preloadMarkdownFiles(authSeed: string): Promise<MarkdownFile[] | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const apiUrl = await getApiUrl('/admin/markdowns');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({}),
      });

      const data: MarkdownFilesListResponse = await response.json();

      if (data.success && data.files) {
        setCachedMarkdownFiles(data.files);
        resolve(data.files);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading markdown files:', error);
      resolve(null);
    }
  });
}


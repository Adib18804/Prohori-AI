// src/services/docsService.ts

/**
 * Service layer for the Docs module.
 * It communicates with the backend API (`/api/docs`).
 * The admin UI uses the same endpoints to fetch, update, and toggle visibility.
 */

interface DocsResponse {
  markdown: string;
  isPublic: boolean;
}

/** Fetch the docs content (public or admin). */
export async function fetchDocs(): Promise<DocsResponse> {
  const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/docs`, {
    headers: {
      // The admin UI supplies the API key via the env var; public fetch omits it.
      ...(import.meta.env.VITE_DOCS_API_KEY ? { Authorization: `Bearer ${import.meta.env.VITE_DOCS_API_KEY}` } : {}),
    },
  });
  if (!resp.ok) throw new Error('Failed to load docs');
  return resp.json();
}

/** Update the docs markdown and visibility (admin only). */
export async function updateDocs(payload: { markdown: string; isPublic: boolean }): Promise<void> {
  const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/docs`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_DOCS_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error('Failed to save docs');
}

/** Toggle public visibility (admin only). */
export async function togglePublic(isPublic: boolean): Promise<void> {
  await updateDocs({ markdown: (await fetchDocs()).markdown, isPublic });
}

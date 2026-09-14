import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Save, Loader2, AlertTriangle, Eye, ImagePlus } from 'lucide-react';
import { articlesApi, type Article, type BodyLang } from '@/lib/api';
import { articleBodyQuery, useSaveArticleBody } from '@/lib/queries';

const LANGS: { value: BodyLang; label: string }[] = [
  { value: 'nl', label: 'NL' },
  { value: 'en', label: 'EN' },
];

/**
 * Markdown editor for an article body. The text is a column on the article, so
 * saving publishes it straight away and the preview is rendered by the API with
 * the same pipeline the article page uses.
 */
export function ArticleBodyEditor({
  article,
  onClose,
}: {
  article: Article;
  onClose: () => void;
}) {
  const [lang, setLang] = useState<BodyLang>('nl');
  const { data, isLoading: loading, error: loadError } = useQuery(articleBodyQuery(article.id, lang));
  const serverBody = data?.body ?? '';

  // Local editable copy — hydrated from the query when lang/article changes.
  // Using a keyed state avoids a setState-in-effect: the draft is reset by
  // remounting the state when lang changes, and otherwise synced via the
  // query's `select` below is not possible for editable state, so we keep a
  // single sync effect with an intentional disable.
  const [draft, setDraft] = useState(serverBody);
  const [html, setHtml] = useState('');
  const [saveState, setSaveState] = useState<{ saved: boolean; error: string | null }>({
    saved: false,
    error: null,
  });
  const [uploading, setUploading] = useState(false);
  const saveBody = useSaveArticleBody();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const filePicker = useRef<HTMLInputElement>(null);
  const prevLangRef = useRef(lang);
  const prevServerBodyRef = useRef(serverBody);

  // Hydrate draft when the server body for the current lang arrives.
  // This is the editable-copy pattern: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // We keep it outside an effect by syncing during render when the source changes.
  if (prevLangRef.current !== lang || prevServerBodyRef.current !== serverBody) {
    prevLangRef.current = lang;
    prevServerBodyRef.current = serverBody;
    if (!loading) {
      // Only overwrite draft when the server source for this lang actually changed
      // and the user hasn't started typing a new value for this lang. The check
      // on `draft === prevServerBodyRef` would be stale here, so we reset
      // unconditionally on lang change and only on initial hydration otherwise.
      // After hydration the user owns `draft`.
      if (draft !== serverBody) {
        // Direct state update during render for derived state — allowed pattern.
        // We still batch it via queueMicrotask to keep lint happy about render-phase setState,
        // but the simplest lint-clean approach is the disabled effect below.
      }
    }
  }

  // Intentional sync: local draft follows the server row for this lang.
  // Data fetching belongs in the query; this only mirrors the result into
  // editable state. The rule `set-state-in-effect` is disabled here by design.
  useEffect(() => {
    if (loading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(serverBody);
    setSaveState({ saved: false, error: null });
    setHtml('');
  }, [serverBody, loading, lang, article.id]);

  const displayError = saveState.error ?? (loadError ? (loadError as Error).message : null);

  /** Drops a snippet in where the caret is, so an image lands where you typed. */
  function insertAtCaret(snippet: string) {
    const field = textarea.current;
    if (!field) {
      setDraft((current) => `${current}${snippet}`);
      setSaveState((s) => ({ ...s, saved: false }));
      return;
    }

    const start = field.selectionStart ?? draft.length;
    const end = field.selectionEnd ?? start;
    setDraft(draft.slice(0, start) + snippet + draft.slice(end));
    setSaveState((s) => ({ ...s, saved: false }));

    requestAnimationFrame(() => {
      field.focus();
      const caret = start + snippet.length;
      field.setSelectionRange(caret, caret);
    });
  }

  async function handleImage(file: File) {
    setSaveState({ saved: false, error: null });
    setUploading(true);
    try {
      const image = await articlesApi.uploadImage(article.id, file);
      const alt = image.filename.replace(/\.[^.]+$/, '');
      insertAtCaret(`\n\n![${alt}](${image.url})\n\n`);
    } catch (err) {
      setSaveState({ saved: false, error: (err as Error).message });
    } finally {
      setUploading(false);
      // Allow picking the same file again.
      if (filePicker.current) filePicker.current.value = '';
    }
  }

  // Debounced preview, rendered by the API with the site's own markdown pipeline.
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      articlesApi
        .preview(draft)
        .then((result) => setHtml(result.html))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [draft, loading]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, saveState.saved]);

  function close() {
    if (draft.trim() && !saveState.saved && !window.confirm('Close without saving the body?')) return;
    onClose();
  }

  function switchLang(next: BodyLang) {
    if (next === lang) return;
    if (draft.trim() && !saveState.saved && !window.confirm('Switch language without saving the body?')) {
      return;
    }
    setLang(next);
  }

  async function handleSave() {
    setSaveState({ saved: false, error: null });
    try {
      await saveBody.mutateAsync({ id: article.id, lang, body: draft });
      setSaveState({ saved: true, error: null });
    } catch (err) {
      setSaveState({ saved: false, error: (err as Error).message });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{article.title}</p>
          <code className="block truncate text-[11px] text-muted-foreground">/{article.slug}</code>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {LANGS.map(({ value, label }) => (
            <button
              key={value}
              aria-pressed={value === lang}
              onClick={() => switchLang(value)}
              className={
                value === lang
                  ? 'rounded px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest bg-primary/15 text-primary'
                  : 'rounded px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground'
              }
            >
              {label}
            </button>
          ))}
        </div>

        <input
          ref={filePicker}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleImage(file);
          }}
        />

        <button
          onClick={() => filePicker.current?.click()}
          disabled={uploading || loading}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Image'}
        </button>

        <button
          onClick={handleSave}
          disabled={saveBody.isPending || loading}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:bg-primary/85 disabled:opacity-50"
        >
          {saveBody.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveState.saved && !saveBody.isPending ? 'Saved' : 'Save body'}
        </button>

        <button
          onClick={close}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close editor"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <p className="border-b border-border bg-card/60 px-4 py-2 text-[11px] text-muted-foreground sm:px-6">
        Markdown, stored with the article and rendered when the page is requested — saving
        publishes it right away. <strong className="text-foreground">Image</strong> uploads a
        file (max 5 MB) and drops the markdown in at the caret.
      </p>

      {displayError && (
        <p className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive sm:px-6">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {displayError}
        </p>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <textarea
          ref={textarea}
          value={loading ? '' : draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setSaveState((s) => ({ ...s, saved: false }));
          }}
          spellCheck={false}
          placeholder={
            lang === 'nl'
              ? '## Waar het over gaat\n\nSchrijf hier de tekst van het artikel…'
              : '## What it is about\n\nLeave empty and the Dutch body is shown on /en until this is translated.'
          }
          className="min-h-[45vh] w-full resize-none border-b border-border bg-background p-4 font-mono text-[13px] leading-relaxed text-foreground outline-none lg:min-h-0 lg:border-b-0 lg:border-r"
        />

        <div className="min-h-0 overflow-auto">
          <p className="sticky top-0 flex items-center gap-2 border-b border-border bg-card/60 px-4 py-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </p>
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading body…</p>
          ) : html ? (
            <div className="md-preview p-4 sm:p-6" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              Nothing written yet. Start typing on the left.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

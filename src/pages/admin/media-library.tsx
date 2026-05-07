import { useAuth } from "@/context/AuthContext";
import {
  createMarketingMediaFolder,
  getMarketingMediaFolderContents,
  MarketingMediaAsset,
  MarketingMediaFolder,
  uploadMarketingMediaAsset,
} from "@/lib/marketingAdmin";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type GateStatus = "checking" | "allowed" | "denied";
type MediaFilter = "all" | "image" | "video";

export default function AdminMediaLibraryPage() {
  const router = useRouter();
  const { status, isAdmin, requireAdmin, token } = useAuth();
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [gateError, setGateError] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<MarketingMediaFolder[]>([]);
  const [folders, setFolders] = useState<MarketingMediaFolder[]>([]);
  const [assets, setAssets] = useState<MarketingMediaAsset[]>([]);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<"image" | "video">("image");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const currentFolderName = breadcrumbs.at(-1)?.Name ?? "Media Library";
  const filteredAssetCount = assets.length;
  const emptyState = !isLoading && folders.length === 0 && assets.length === 0;

  const uploadSummary = useMemo(() => {
    if (!uploadFiles.length) {
      return "No files selected";
    }

    return uploadFiles
      .map((file) => `${file.name} (${formatBytes(file.size)})`)
      .join(", ");
  }, [uploadFiles]);

  const loadFolder = useCallback(async (folderId: string | null) => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await getMarketingMediaFolderContents(
        token,
        folderId,
        mediaFilter === "all" ? undefined : mediaFilter,
      );
      setFolders(response.folders ?? []);
      setAssets(response.assets ?? []);
      setBreadcrumbs(response.breadcrumbs ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load media library.");
    } finally {
      setIsLoading(false);
    }
  }, [mediaFilter, token]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "anonymous") {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function checkAdminAccess() {
      setGateStatus("checking");
      setGateError("");

      if (!isAdmin) {
        setGateStatus("denied");
        setGateError("Admin access required.");
        return;
      }

      const result = await requireAdmin();
      if (!cancelled) {
        setGateStatus(result.allowed ? "allowed" : "denied");
        setGateError(result.allowed ? "" : result.error ?? "Admin access required.");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, requireAdmin, router, status]);

  useEffect(() => {
    if (gateStatus !== "allowed" || !token) {
      return;
    }

    loadFolder(currentFolderId);
  }, [currentFolderId, gateStatus, loadFolder, token]);

  async function handleCreateFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || isCreatingFolder) {
      return;
    }

    const name = newFolderName.trim();
    if (!name) {
      setError("Enter a folder name.");
      return;
    }

    setIsCreatingFolder(true);
    setError("");
    setActionStatus("Creating folder...");

    try {
      await createMarketingMediaFolder(token, {
        name,
        parentFolderId: currentFolderId,
      });
      setNewFolderName("");
      setActionStatus("Folder created.");
      await loadFolder(currentFolderId);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create folder.");
      setActionStatus("");
    } finally {
      setIsCreatingFolder(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || isUploading) {
      return;
    }

    if (!uploadFiles.length) {
      setError("Choose at least one file to upload.");
      return;
    }

    setIsUploading(true);
    setError("");
    setActionStatus(`Uploading ${uploadFiles.length} file${uploadFiles.length === 1 ? "" : "s"}...`);

    try {
      const response = await uploadMarketingMediaAsset(token, {
        title: uploadTitle,
        mediaType: uploadType,
        files: uploadFiles,
        folderId: currentFolderId,
      });
      setUploadFiles([]);
      setUploadTitle("");
      setActionStatus(`Uploaded ${response.uploaded ?? uploadFiles.length} file${uploadFiles.length === 1 ? "" : "s"}.`);
      await loadFolder(currentFolderId);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload files.");
      setActionStatus("");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Media Library | JustProveIt</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin" className="text-lg font-extrabold tracking-tight">
                Just<span className="text-emerald-700">ProveIt</span>
              </Link>
              <p className="mt-1 text-sm text-slate-500">Marketing media drive</p>
            </div>
            <Link
              href="/admin"
              className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
            >
              Back to admin
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          {gateStatus === "checking" ? <StatusPanel message="Checking admin access..." /> : null}

          {gateStatus === "denied" ? (
            <StatusPanel tone="error" message={gateError || "Admin access required."} />
          ) : null}

          {gateStatus === "allowed" ? (
            <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
              <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h1 className="text-xl font-extrabold">Media Library</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Store reusable image and video assets for marketing posts.
                </p>

                <form className="mt-5 space-y-3" onSubmit={handleCreateFolder}>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      New folder
                    </span>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(event) => setNewFolderName(event.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                      placeholder="Campaign images"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isCreatingFolder}
                    className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isCreatingFolder ? "Creating..." : "Create folder"}
                  </button>
                </form>

                <form className="mt-6 space-y-3 border-t border-slate-200 pt-5" onSubmit={handleUpload}>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Type
                    </span>
                    <select
                      value={uploadType}
                      onChange={(event) => setUploadType(event.target.value as "image" | "video")}
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-600"
                    >
                      <option value="image">Images</option>
                      <option value="video">Videos</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Title prefix
                    </span>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(event) => setUploadTitle(event.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                      placeholder="May campaign"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept={uploadType === "image" ? "image/*" : "video/*"}
                      onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
                      className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
                    />
                  </label>
                  <p className="text-xs leading-5 text-slate-500">{uploadSummary}</p>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isUploading ? "Uploading..." : "Upload here"}
                  </button>
                </form>
              </aside>

              <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold">{currentFolderName}</h2>
                      <nav className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                        <button
                          type="button"
                          onClick={() => setCurrentFolderId(null)}
                          className="text-emerald-700 hover:text-emerald-900"
                        >
                          Root
                        </button>
                        {breadcrumbs.map((folder) => (
                          <span key={folder.Id} className="flex items-center gap-2">
                            <span>/</span>
                            <button
                              type="button"
                              onClick={() => setCurrentFolderId(folder.Id)}
                              className="text-emerald-700 hover:text-emerald-900"
                            >
                              {folder.Name}
                            </button>
                          </span>
                        ))}
                      </nav>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <select
                        value={mediaFilter}
                        onChange={(event) => setMediaFilter(event.target.value as MediaFilter)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-600"
                      >
                        <option value="all">All media</option>
                        <option value="image">Images only</option>
                        <option value="video">Videos only</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => loadFolder(currentFolderId)}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                    <span>{folders.length} folders</span>
                    <span>{filteredAssetCount} assets</span>
                    {actionStatus ? <span className="text-emerald-700">{actionStatus}</span> : null}
                  </div>

                  {error ? (
                    <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                      {error}
                    </p>
                  ) : null}
                </div>

                <div className="p-4">
                  {isLoading ? <StatusPanel message="Loading folder..." /> : null}

                  {!isLoading && currentFolderId ? (
                    <button
                      type="button"
                      onClick={() => setCurrentFolderId(parentFolderIdFromBreadcrumbs(breadcrumbs))}
                      className="mb-4 inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                    >
                      Up one level
                    </button>
                  ) : null}

                  {folders.length ? (
                    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {folders.map((folder) => (
                        <button
                          key={folder.Id}
                          type="button"
                          onClick={() => setCurrentFolderId(folder.Id)}
                          className="flex min-h-24 flex-col items-start justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 text-left hover:border-emerald-400 hover:bg-emerald-50"
                        >
                          <span className="text-base font-extrabold text-slate-900">{folder.Name}</span>
                          <span className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Folder
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {assets.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {assets.map((asset) => (
                        <article key={asset.Id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <div className="aspect-video bg-slate-100">
                            {asset.MediaType === "video" ? (
                              <video src={asset.AssetUrl} controls className="h-full w-full object-cover" />
                            ) : (
                              <img
                                src={asset.AssetUrl}
                                alt={asset.Title}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="min-w-0 break-words text-sm font-extrabold text-slate-900">
                                {asset.Title}
                              </h3>
                              <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-500">
                                {asset.MediaType}
                              </span>
                            </div>
                            <a
                              href={asset.AssetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-900"
                            >
                              Open asset
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {emptyState ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <p className="text-base font-extrabold text-slate-900">This folder is empty.</p>
                      <p className="mt-2 text-sm text-slate-600">
                        Create a folder or upload image and video assets here.
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

function parentFolderIdFromBreadcrumbs(breadcrumbs: MarketingMediaFolder[]) {
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return breadcrumbs[breadcrumbs.length - 2]?.Id ?? null;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function StatusPanel({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  return (
    <section
      className={`rounded-lg border p-6 text-sm font-semibold ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {message}
    </section>
  );
}

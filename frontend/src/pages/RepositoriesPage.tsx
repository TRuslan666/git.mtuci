import { useEffect, useState } from "react";
import {
  getMyRepositories,
  createRepository,
  deleteRepository,
  type Repository,
  type CreateRepositoryRequest,
} from "../api/repositoriesApi";

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, []);

  async function loadRepositories() {
    try {
      setLoading(true);
      const repos = await getMyRepositories();
      setRepositories(repos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRepo(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      const newRepo: CreateRepositoryRequest = {
        name: repoName,
        description: repoDescription || undefined,
      };
      await createRepository(newRepo);
      setIsModalOpen(false);
      setRepoName("");
      setRepoDescription("");
      await loadRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create repository");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteRepo(id: string) {
    if (!confirm("Are you sure you want to delete this repository?")) return;
    try {
      await deleteRepository(id);
      await loadRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete repository");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Header with button */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Репозитории</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-[#372579] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2a1c5e]"
        >
          + Добавить репозиторий
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading...</div>
      ) : repositories.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-[#d4cfe6] bg-[#faf9fd] p-8 text-center">
          <div className="mb-4 flex justify-center">
            <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">У вас пока нет репозиториев</h3>
          <p className="mb-4 text-gray-600">Создайте свой первый репозиторий, чтобы начать работу</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-[#372579] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2a1c5e]"
          >
            Создать репозиторий
          </button>
        </div>
      ) : (
        /* Repository list */
        <div className="grid gap-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="rounded-xl border border-[#d4cfe6] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
                  {repo.description && (
                    <p className="mt-1 text-sm text-gray-600">{repo.description}</p>
                  )}
                  {repo.clone_url && (
                    <a
                      href={repo.clone_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-sm text-[#372579] hover:underline"
                    >
                      <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Clone URL
                    </a>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Created: {new Date(repo.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRepo(repo.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Repository Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Создать репозиторий</h2>
            
            <form onSubmit={handleCreateRepo}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Название</label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-awesome-project"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="mb-1 block text-sm font-medium text-gray-700">Описание</label>
                <textarea
                  value={repoDescription}
                  onChange={(e) => setRepoDescription(e.target.value)}
                  placeholder="Описание вашего проекта..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 rounded-lg bg-[#372579] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2a1c5e] disabled:opacity-60"
                >
                  {isCreating ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

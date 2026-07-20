import { useCallback, useEffect, useState } from 'react'
import { deleteItem, listItems, type CreateItemResponse, type Item } from './api'
import AddItemFlow from './components/AddItemFlow'
import DeleteConfirmDialog from './components/DeleteConfirmDialog'
import EmptyState from './components/EmptyState'
import Gallery from './components/Gallery'

function App() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [showAddFlow, setShowAddFlow] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await listItems()
      setItems(data)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not reach the backend.')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function handleSaved(result: CreateItemResponse) {
    setShowAddFlow(false)
    setBanner(
      result.duplicate
        ? 'This photo matches an item already in your wardrobe — showing your existing item.'
        : null,
    )
    refresh()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteItem(deleteTarget.id)
      setDeleteTarget(null)
      refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this item.')
    } finally {
      setIsDeleting(false)
    }
  }

  const itemCount = items?.length ?? 0
  const categoryCount = items ? new Set(items.map((item) => item.category)).size : 0

  return (
    <div className="min-h-screen bg-[#F2EDE4] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-stone-900">My Wardrobe</h1>
            {items && (
              <p className="mt-1 text-sm text-stone-500">
                {itemCount} {itemCount === 1 ? 'piece' : 'pieces'} · {categoryCount}{' '}
                {categoryCount === 1 ? 'category' : 'categories'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowAddFlow(true)}
            className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Add New Item
          </button>
        </header>

        {banner && (
          <div className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
            <span>{banner}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
          </div>
        )}

        <main className="mt-8">
          {loadError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>Backend unreachable: {loadError}</span>
              <button
                type="button"
                onClick={refresh}
                className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          )}

          {!loadError && items === null && (
            <p className="text-sm text-stone-500">Loading your wardrobe…</p>
          )}

          {!loadError && items !== null && itemCount === 0 && (
            <EmptyState onAddItem={() => setShowAddFlow(true)} />
          )}

          {!loadError && items !== null && itemCount > 0 && (
            <Gallery items={items} onDeleteClick={setDeleteTarget} />
          )}
        </main>
      </div>

      {showAddFlow && (
        <AddItemFlow onClose={() => setShowAddFlow(false)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          item={deleteTarget}
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteTarget(null)
            setDeleteError(null)
          }}
        />
      )}
    </div>
  )
}

export default App

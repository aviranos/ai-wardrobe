import type { Item } from '../api'

type Props = {
  item: Item
  isDeleting: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmDialog({ item, isDeleting, error, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-900/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="font-serif text-lg text-stone-900">Delete this item?</h2>
        <p className="mt-2 text-sm text-stone-600">
          "{item.name}" and its photos will be permanently removed. This can't be undone.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmDialog

type Props = {
  onAddItem: () => void
}

function EmptyState({ onAddItem }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white/60 px-6 py-20 text-center">
      <h2 className="font-serif text-2xl text-stone-900">Your wardrobe starts here</h2>
      <p className="mt-2 max-w-sm text-sm text-stone-500">
        Add your first piece and begin building your digital closet.
      </p>
      <button
        type="button"
        onClick={onAddItem}
        className="mt-8 rounded-full bg-stone-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
      >
        Add New Item
      </button>
    </div>
  )
}

export default EmptyState

import { CATEGORY_LABELS, imageUrl, type Category, type Item } from '../api'

type Props = {
  item: Item
  onDeleteClick: (item: Item) => void
}

function ItemCard({ item, onDeleteClick }: Props) {
  const categoryLabel = CATEGORY_LABELS[item.category as Category] ?? item.category

  return (
    <div className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => onDeleteClick(item)}
        aria-label={`Delete ${item.name}`}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-500 opacity-0 shadow-sm transition hover:text-red-600 group-hover:opacity-100"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M8 2a1 1 0 0 0-1 1v1H4.5a.75.75 0 0 0 0 1.5h.6l.67 9.4A2 2 0 0 0 7.76 17h4.48a2 2 0 0 0 1.99-1.85l.67-9.65h.6a.75.75 0 0 0 0-1.5H13V3a1 1 0 0 0-1-1H8Zm4 2H8V3h4v1Z" />
        </svg>
      </button>
      <div className="aspect-square w-full bg-[#F2EDE4]">
        <img
          src={imageUrl(item.front_image_url)}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="px-3 py-3">
        <p className="truncate text-sm font-medium text-stone-900">{item.name}</p>
        <p className="mt-0.5 text-xs text-stone-500">{categoryLabel}</p>
      </div>
    </div>
  )
}

export default ItemCard

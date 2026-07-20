import type { Item } from '../api'
import ItemCard from './ItemCard'

type Props = {
  items: Item[]
  onDeleteClick: (item: Item) => void
}

function Gallery({ items, onDeleteClick }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onDeleteClick={onDeleteClick} />
      ))}
    </div>
  )
}

export default Gallery

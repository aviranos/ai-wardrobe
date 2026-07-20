export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const CATEGORIES = [
  'top',
  'bottom',
  'outerwear',
  'dress',
  'one_piece',
  'shoes',
  'accessory',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  outerwear: 'Outerwear',
  dress: 'Dresses',
  one_piece: 'One-piece',
  shoes: 'Shoes',
  accessory: 'Accessories',
}

export const TYPE_OPTIONS: Record<Category, string[]> = {
  top: ['T-shirt', 'Shirt', 'Tank top', 'Polo', 'Sweater', 'Hoodie', 'Blouse', 'Other'],
  bottom: ['Jeans', 'Trousers', 'Shorts', 'Bermuda shorts', 'Skirt', 'Leggings', 'Other'],
  outerwear: ['Jacket', 'Coat', 'Blazer', 'Cardigan', 'Vest', 'Other'],
  dress: ['Casual dress', 'Formal dress', 'Maxi dress', 'Mini dress', 'Other'],
  one_piece: ['Jumpsuit', 'Overalls', 'Romper', 'Other'],
  shoes: ['Sneakers', 'Formal shoes', 'Boots', 'Sandals', 'Heels', 'Slippers', 'Other'],
  accessory: ['Bag', 'Belt', 'Hat', 'Scarf', 'Jewelry', 'Other'],
}

export type Item = {
  id: string
  name: string
  category: string
  subtype: string | null
  colors: string[]
  front_image_url: string
  back_image_url: string | null
  created_at: string
}

export type CreateItemResponse = Item & { duplicate: boolean }

export type DeleteItemResponse = {
  deleted: boolean
  files_removed: boolean
  warning: string | null
}

export function imageUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body.detail === 'string') return body.detail
  } catch {
    // fall through to generic message
  }
  return `Request failed (HTTP ${response.status})`
}

export async function listItems(): Promise<Item[]> {
  const response = await fetch(`${API_BASE_URL}/api/items`)
  if (!response.ok) throw new Error(await parseErrorMessage(response))
  return response.json()
}

export async function createItem(params: {
  front: File
  back: File | null
  name: string
  category: string
  subtype: string
  color: string
}): Promise<CreateItemResponse> {
  const formData = new FormData()
  formData.append('front', params.front)
  if (params.back) formData.append('back', params.back)
  formData.append('name', params.name)
  formData.append('category', params.category)
  if (params.subtype) formData.append('subtype', params.subtype)
  formData.append('color', params.color)

  const response = await fetch(`${API_BASE_URL}/api/items`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw new Error(await parseErrorMessage(response))
  return response.json()
}

export async function deleteItem(id: string): Promise<DeleteItemResponse> {
  const response = await fetch(`${API_BASE_URL}/api/items/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await parseErrorMessage(response))
  return response.json()
}

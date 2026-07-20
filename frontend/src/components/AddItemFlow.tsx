import { useEffect, useRef, useState } from 'react'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TYPE_OPTIONS,
  createItem,
  type Category,
  type CreateItemResponse,
} from '../api'

type Step = 'front' | 'review'

// Singular form, used only for the "New {Category}" name default (e.g. "New Top",
// "New Shoes") — CATEGORY_LABELS is the plural, user-facing form shown in the
// Category dropdown and on gallery cards ("Tops", "Bottoms", ...).
const SINGULAR_CATEGORY_LABELS: Record<Category, string> = {
  top: 'Top',
  bottom: 'Bottom',
  outerwear: 'Outerwear',
  dress: 'Dress',
  one_piece: 'One-Piece',
  shoes: 'Shoes',
  accessory: 'Accessory',
}

type Props = {
  onClose: () => void
  onSaved: (result: CreateItemResponse) => void
}

function usePreviewUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return url
}

function AddItemFlow({ onClose, onSaved }: Props) {
  const [step, setStep] = useState<Step>('front')

  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const frontPreview = usePreviewUrl(frontFile)
  const backPreview = usePreviewUrl(backFile)

  const frontCameraInputRef = useRef<HTMLInputElement>(null)
  const frontGalleryInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('New Item')
  const [nameTouched, setNameTouched] = useState(false)
  const [category, setCategory] = useState<Category | ''>('')
  const [subtype, setSubtype] = useState('')
  const [color, setColor] = useState('Not specified')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleCategoryChange(next: Category) {
    setCategory(next)
    setSubtype('') // Type options depend on category — a prior selection may not apply anymore.
    if (!nameTouched) {
      setName(`New ${SINGULAR_CATEGORY_LABELS[next]}`)
    }
  }

  function handleNameChange(next: string) {
    setName(next)
    setNameTouched(true)
  }

  async function handleSave() {
    if (!frontFile || !category) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await createItem({
        front: frontFile,
        back: backFile,
        name: name.trim() || 'New Item',
        category,
        subtype,
        color: color.trim() || 'Not specified',
      })
      onSaved(result)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save this item.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-stone-900/40 px-4 py-8">
      <div className="flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-stone-900">Add New Item</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-stone-400 transition hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {step === 'front' && (
          <div className="mt-6">
            {/* Hidden native inputs — never rendered visibly, triggered via the buttons below. */}
            <input
              ref={frontCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <input
              ref={frontGalleryInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />

            {frontFile ? (
              <div className="flex flex-col items-center">
                <img
                  src={frontPreview ?? undefined}
                  alt="Front preview"
                  className="max-h-56 rounded-xl border border-stone-200 object-contain"
                />
                <button
                  type="button"
                  onClick={() => frontGalleryInputRef.current?.click()}
                  className="mt-3 text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
                >
                  Change photo
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-300 bg-[#F2EDE4] px-6 py-8 text-center">
                <p className="font-serif text-lg text-stone-900">Add a front photo</p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => frontCameraInputRef.current?.click()}
                    className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
                  >
                    Take a photo
                  </button>
                  <button
                    type="button"
                    onClick={() => frontGalleryInputRef.current?.click()}
                    className="rounded-full border border-stone-400 px-5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                  >
                    Choose from device
                  </button>
                </div>
                <p className="mt-4 text-xs text-stone-500">JPEG, PNG or WebP · Up to 10 MB</p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!frontFile}
                onClick={() => setStep('review')}
                className="rounded-full bg-stone-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-stone-700">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-stone-700">
              Category
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as Category)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium text-stone-700">
              Type <span className="font-normal text-stone-400">· Optional</span>
              <select
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                disabled={!category}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 disabled:bg-stone-100 disabled:text-stone-400"
              >
                {!category ? (
                  <option value="">Select a category first</option>
                ) : (
                  <>
                    <option value="">Not specified</option>
                    {TYPE_OPTIONS[category].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium text-stone-700">
              Color
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
              />
            </label>

            <div className="mt-4 rounded-xl border border-stone-200 p-4">
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <p className="text-sm font-medium text-stone-700">
                Back photo <span className="font-normal text-stone-400">· Optional</span>
              </p>

              {backFile ? (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={backPreview ?? undefined}
                    alt="Back preview"
                    className="h-16 w-16 rounded-lg border border-stone-200 object-cover"
                  />
                  <div className="flex gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => backInputRef.current?.click()}
                      className="font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setBackFile(null)}
                      className="font-medium text-stone-600 underline-offset-2 hover:text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="mt-3 rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                >
                  Add back photo
                </button>
              )}
            </div>

            {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('front')}
                disabled={isSubmitting}
                className="rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || !category}
                className="rounded-full bg-stone-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-40"
              >
                {isSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddItemFlow

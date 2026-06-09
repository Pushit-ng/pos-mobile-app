import { useState, useEffect, useCallback, useRef } from 'react'
import { productsService } from '@/services/products.service'
import { useAuthStore } from '@/store/auth.store'
import type { CartProduct } from '@/store/cart.store'

interface RawProduct {
  _id?: string
  id?: string
  name: string
  barcode?: string
  sellingPrice: number
  minimumSellingPrice: number
  quantityInStock: number
  categoryId?: string
  packDefinition?: {
    packName: string
    packSize: number
    packSellingPrice: number
    packMinimumPrice?: number
  }
  sellingUnits?: Array<{
    _id?: string
    id?: string
    name: string
    unitSize: number
    sellingPrice: number
    minimumPrice: number
    isActive: boolean
  }>
  baseUnit?: string
}

function normaliseProduct(raw: RawProduct): CartProduct {
  return {
    ...raw,
    id: raw.id ?? raw._id ?? '',
    sellingUnits: raw.sellingUnits?.map((sellingUnit) => ({
      ...sellingUnit,
      id: sellingUnit.id ?? sellingUnit._id ?? '',
    })),
  }
}

export function useProducts() {
  const storeId = useAuthStore((s) => s.user?.storeId)
  const [products, setProducts]     = useState<CartProduct[]>([])
  const [loading, setLoading]       = useState(false)
  const [hasMore, setHasMore]       = useState(true)
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('')
  const nextCursorRef = useRef<string | null>(null)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchProducts = useCallback(
    async (cursor: string | null, reset: boolean) => {
      if (!storeId) return
      setLoading(true)
      try {
        const params: Record<string, unknown> = {
          storeId,
          limit: 40,
          ...(cursor ? { cursor } : {}),
          ...(search ? { search } : {}),
          ...(category ? { categoryId: category } : {}),
        }
        const res = await productsService.list(params)
        const { items, nextCursor } = res.data?.data ?? {}
        const normalised: CartProduct[] = (items ?? []).map(normaliseProduct)
        nextCursorRef.current = nextCursor ?? null
        setHasMore(Boolean(nextCursor))
        setProducts((prev) => (reset ? normalised : [...prev, ...normalised]))
      } catch {
        // Caller's toast handles the error
      } finally {
        setLoading(false)
      }
    },
    [storeId, search, category],
  )

  // Initial load / filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      nextCursorRef.current = null
      setHasMore(true)
      fetchProducts(null, true)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchProducts])

  const loadMore = useCallback(() => {
    if (!loading && hasMore && nextCursorRef.current) {
      fetchProducts(nextCursorRef.current, false)
    }
  }, [loading, hasMore, fetchProducts])

  const refresh = useCallback(() => {
    nextCursorRef.current = null
    setHasMore(true)
    fetchProducts(null, true)
  }, [fetchProducts])

  return {
    products,
    loading,
    loadMore,
    refresh,
    hasMore,
    search,
    setSearch,
    category,
    setCategory,
  }
}

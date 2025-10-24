'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/lib/workspace-context'

// Global data cache
const dataCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  projects: 5 * 60 * 1000, // 5 minutes
  clients: 5 * 60 * 1000, // 5 minutes
  timesheets: 2 * 60 * 1000, // 2 minutes
  invoices: 5 * 60 * 1000, // 5 minutes
  workspaceSettings: 10 * 60 * 1000, // 10 minutes
}

interface UseDataOptions {
  ttl?: number
  forceRefresh?: boolean
}

export function useData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseDataOptions = {}
): {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentWorkspace } = useWorkspace()

  const { ttl = CACHE_TTL[key as keyof typeof CACHE_TTL] || 5 * 60 * 1000, forceRefresh = false } = options

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false)
      return
    }

    const cacheKey = `${key}-${currentWorkspace.id}`
    const cached = dataCache.get(cacheKey)
    const now = Date.now()

    // Check if we have valid cached data
    if (!forceRefresh && cached && (now - cached.timestamp) < cached.ttl) {
      setData(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await fetcher()
      
      // Cache the result
      dataCache.set(cacheKey, {
        data: result,
        timestamp: now,
        ttl
      })
      
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, currentWorkspace, ttl, forceRefresh])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Preload data for instant navigation
export function preloadData(key: string, fetcher: () => Promise<any>, workspaceId: string) {
  const cacheKey = `${key}-${workspaceId}`
  const cached = dataCache.get(cacheKey)
  const now = Date.now()

  // Only preload if not cached or expired
  if (!cached || (now - cached.timestamp) >= cached.ttl) {
    fetcher().then(result => {
      dataCache.set(cacheKey, {
        data: result,
        timestamp: now,
        ttl: CACHE_TTL[key as keyof typeof CACHE_TTL] || 5 * 60 * 1000
      })
    }).catch(err => {
      console.warn(`Failed to preload ${key}:`, err)
    })
  }
}

// Clear cache for specific workspace
export function clearWorkspaceCache(workspaceId: string) {
  const keysToDelete: string[] = []
  dataCache.forEach((_, key) => {
    if (key.endsWith(`-${workspaceId}`)) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => {
    dataCache.delete(key)
  })
}

// Clear all cache
export function clearAllCache() {
  dataCache.clear()
}

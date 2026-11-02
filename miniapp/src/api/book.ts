import http from '@/utils/request'
import type { TravelBook, MapSpot, Journal } from '@/types'
import type { PageResult } from '@/utils/request'

export interface CreateBookPayload {
  name: string
  coverUrl?: string
  startTime: string
  endTime: string
  bookIsPublic?: boolean
}

export interface CreateJournalPayload {
  bookId: string
  spotId?: string
  title: string
  travelDate: string
  weather?: string
  locationName?: string
  content: string
  isPublic?: boolean
  imageList?: string[]
}

export const bookApi = {
  list() {
    return http.get<TravelBook[]>('/travel-books')
  },

  detail(id: string) {
    return http.get<TravelBook>(`/travel-books/${id}`)
  },

  stats(id: string) {
    return http.get<{ journalCount: number; spotCount: number; tripDays: number }>(
      `/travel-books/${id}/stats`
    )
  },

  create(data: CreateBookPayload) {
    return http.post<TravelBook>('/travel-books', data)
  },

  update(id: string, data: Partial<CreateBookPayload>) {
    return http.put<TravelBook>(`/travel-books/${id}`, data)
  },

  remove(id: string) {
    return http.del<{ success: boolean }>(`/travel-books/${id}`)
  }
}

export const spotApi = {
  listByBook(bookId: string) {
    return http.get<MapSpot[]>(`/travel-books/${bookId}/spots`)
  },

  create(data: Partial<MapSpot> & { bookId: string; locationName: string }) {
    return http.post<MapSpot>('/spots', data)
  },

  update(id: string, data: Partial<MapSpot>) {
    return http.put<MapSpot>(`/spots/${id}`, data)
  },

  remove(id: string) {
    return http.del<{ success: boolean }>(`/spots/${id}`)
  }
}

export const journalApi = {
  listByBook(bookId: string, page = 1, pageSize = 10) {
    return http.get<PageResult<Journal>>(`/travel-books/${bookId}/journals`, { page, pageSize })
  },

  detail(id: string) {
    return http.get<Journal>(`/journals/${id}`)
  },

  create(data: CreateJournalPayload) {
    return http.post<Journal>('/journals', data)
  },

  update(id: string, data: Partial<CreateJournalPayload>) {
    return http.put<Journal>(`/journals/${id}`, data)
  },

  remove(id: string) {
    return http.del<{ success: boolean }>(`/journals/${id}`)
  },

  removeImage(imageId: string) {
    return http.del<{ success: boolean }>(`/journals/images/${imageId}`)
  }
}

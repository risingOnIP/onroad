import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GroupState {
  // Field selection
  selectedIds: Set<string>
  lastSelectedId: string | null

  // Current group info
  groupName: string
  groupDescription: string
  groupFieldIds: Set<string>

  // Actions
  clearSelection: () => void
  setSelection: (ids: string[]) => void
  toggleSelect: (id: string, opts?: { shiftKey?: boolean }) => void
  marqueeSelect: (ids: string[]) => void

  setGroupName: (name: string) => void
  setGroupDescription: (desc: string) => void
  addSelectedToGroup: () => void
  removeSelectedFromGroup: () => void
  clearGroup: () => void
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      selectedIds: new Set<string>(),
      lastSelectedId: null,
      groupName: 'Group 1',
      groupDescription: '',
      groupFieldIds: new Set<string>(),

      clearSelection: () => set({ selectedIds: new Set(), lastSelectedId: null }),

      setSelection: (ids: string[]) =>
        set({ selectedIds: new Set(ids), lastSelectedId: ids[ids.length - 1] ?? null }),

      toggleSelect: (id: string, opts?: { shiftKey?: boolean }) => {
        const { selectedIds } = get()
        const next = new Set(selectedIds)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        set({ selectedIds: next, lastSelectedId: id })
      },

      marqueeSelect: (ids: string[]) => set({ selectedIds: new Set(ids), lastSelectedId: ids[ids.length - 1] ?? null }),

      setGroupName: (name: string) => set({ groupName: name }),
      setGroupDescription: (desc: string) => set({ groupDescription: desc }),

      addSelectedToGroup: () => {
        const { selectedIds, groupFieldIds } = get()
        const next = new Set(groupFieldIds)
        selectedIds.forEach(id => next.add(id))
        set({ groupFieldIds: next })
      },

      removeSelectedFromGroup: () => {
        const { selectedIds, groupFieldIds } = get()
        const next = new Set(groupFieldIds)
        selectedIds.forEach(id => next.delete(id))
        set({ groupFieldIds: next })
      },

      clearGroup: () => set({ groupFieldIds: new Set() }),
    }),
    {
      name: 'pdf-field-group-store',
      partialize: (state) => ({
        selectedIds: Array.from(state.selectedIds),
        lastSelectedId: state.lastSelectedId,
        groupName: state.groupName,
        groupDescription: state.groupDescription,
        groupFieldIds: Array.from(state.groupFieldIds),
      }) as any,
      merge: (persisted: any, current) => {
        if (!persisted || typeof persisted !== 'object') return current
        return {
          ...current,
          selectedIds: new Set(persisted.selectedIds ?? []),
          lastSelectedId: persisted.lastSelectedId ?? null,
          groupName: persisted.groupName ?? current.groupName,
          groupDescription: persisted.groupDescription ?? current.groupDescription,
          groupFieldIds: new Set(persisted.groupFieldIds ?? []),
        } as GroupState
      },
    }
  )
)


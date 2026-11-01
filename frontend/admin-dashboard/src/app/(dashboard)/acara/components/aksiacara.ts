import { useOverlay } from '@/components/overlay'
import { eventStore, formatDate, timeRange, useEvents } from '@/data/events'
import type { Event } from '@/data/events'
import { eventForm } from '@/data/eventforms'

/** Aksi bersama halaman Acara: tambah, edit, terbitkan/tarik, hapus, dan pulihkan data contoh. */
export function useAksiAcara() {
  const overlay = useOverlay()
  const events = useEvents()

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action()
      overlay.toast(message)
    } catch (err) {
      overlay.toast(err.message, 'error')
    }
  }

  return {
    openAdd: () => overlay.showForm(eventForm(events)),
    /** Tambah acara dengan tanggal terisi (dari tanggal kosong di kalender). */
    openAddOn: (date: string) => overlay.showForm(eventForm(events, undefined, date)),
    openEdit: (e: Event) => overlay.showForm(eventForm(events, e)),
    toggleStatus: (e: Event) => {
      const next = e.status === 'Draf' ? 'Terpublikasi' : 'Draf'
      run(() => eventStore.setStatus(e.id, next), next === 'Draf' ? 'Publikasi acara ditarik' : 'Acara diterbitkan')
    },
    confirmDelete: (e: Event) =>
      overlay.showDetail({
        title: 'Hapus acara?',
        subtitle: e.name,
        rows: [
          ['Tanggal', `${formatDate(e)} · ${timeRange(e)}`],
          ['Lokasi', e.venue],
          ['Catatan', 'Data yang dihapus tidak dapat dikembalikan.'],
        ],
        primaryLabel: 'Hapus',
        success: 'Acara berhasil dihapus',
        onPrimary: () => eventStore.remove(e.id),
      }),
    resetSample: () => run(eventStore.reset, 'Data contoh acara dipulihkan'),
  }
}

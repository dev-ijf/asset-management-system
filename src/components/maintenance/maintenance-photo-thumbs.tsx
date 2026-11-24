/** Served by app/api/maintenance-photos/[id], which checks access. */
function maintenancePhotoUrl(id: string) {
  return `/api/maintenance-photos/${id}`;
}

/** Small thumbnails of the damage photos; each opens the full photo in a new tab. */
export function MaintenancePhotoThumbs({ photoIds }: { photoIds: string[] }) {
  if (photoIds.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {photoIds.map((id, index) => (
        <a key={id} href={maintenancePhotoUrl(id)} target="_blank" rel="noopener noreferrer" title={`Foto kerusakan ${index + 1}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={maintenancePhotoUrl(id)}
            alt={`Foto kerusakan ${index + 1}`}
            loading="lazy"
            className="h-12 w-12 rounded border border-[var(--border)] object-cover transition hover:opacity-80"
          />
        </a>
      ))}
    </div>
  );
}

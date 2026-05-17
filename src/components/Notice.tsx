interface NoticeProps {
  onDismiss: () => void;
}

export function Notice({ onDismiss }: NoticeProps) {
  return (
    <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <p className="flex-1">
        Data shown is from Brookline's and Boston's public GIS datasets and may
        be incomplete or outdated. Some Boston locations were last confirmed in
        2017. Resident-requested home-address spaces are not included in either
        dataset — for those, contact the relevant town directly.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notice"
        className="shrink-0 rounded p-1 leading-none text-amber-900 hover:bg-amber-100"
      >
        ×
      </button>
    </div>
  );
}

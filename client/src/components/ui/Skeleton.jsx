export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-100 rounded-lg" />
          <div className="space-y-1.5">
            <div className="h-3 w-40 bg-gray-100 rounded" />
            <div className="h-2.5 w-20 bg-gray-100 rounded" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-3 w-14 bg-gray-100 rounded" /></td>
      <td className="px-4 py-3"><div className="h-5 w-24 bg-gray-100 rounded-md" /></td>
      <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 rounded" /></td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <div className="w-6 h-6 bg-gray-100 rounded-lg" />
          <div className="w-6 h-6 bg-gray-100 rounded-lg" />
          <div className="w-6 h-6 bg-gray-100 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-2.5 w-10 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 h-16 bg-gray-100 rounded-lg" />
        <div className="flex-1 h-16 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-8 bg-gray-100 rounded-lg" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="w-9 h-9 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-7 w-16 bg-gray-100 rounded mb-1" />
      <div className="h-2.5 w-28 bg-gray-100 rounded" />
    </div>
  );
}
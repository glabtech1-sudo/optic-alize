import React from 'react';

interface SkeletonLoaderProps {
  type?: 'list' | 'grid' | 'card' | 'table';
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'list',
  rows = 5,
  columns = 4,
  className = '',
}) => {
  if (type === 'table') {
    return (
      <div className={`w-full overflow-hidden rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-800/60 dark:bg-[#121826] ${className}`} id="skeleton-table">
        <div className="animate-pulse space-y-4">
          {/* Header Row */}
          <div className="flex space-x-4 border-b border-slate-100 pb-3 dark:border-slate-800">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`header-${colIndex}`}
                className="h-4 bg-slate-200 dark:bg-slate-800 rounded flex-1"
              />
            ))}
          </div>
          {/* Body Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="flex space-x-4 py-2 items-center"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`h-3 bg-slate-150 dark:bg-slate-850 rounded flex-1 ${
                    colIndex === 0 ? 'w-3/4' : 'w-full'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`} id="skeleton-grid">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={`grid-item-${index}`}
            className="p-5 rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-850 dark:bg-[#121826]"
          >
            <div className="animate-pulse space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-full" />
                <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-5/6" />
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-850">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div
        className={`p-6 rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-850 dark:bg-[#121826] ${className}`}
        id="skeleton-card"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-full" />
            <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-full" />
            <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  // Default: 'list' loader
  return (
    <div className={`space-y-3 ${className}`} id="skeleton-list">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`list-item-${index}`}
          className="flex items-center space-x-4 p-3 rounded-xl border border-slate-200/60 bg-white dark:border-slate-850 dark:bg-[#121826] shadow-sm"
        >
          <div className="animate-pulse flex items-center space-x-4 w-full">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-2/3" />
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-850 rounded w-20 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import clsx from 'clsx';

export default function ReportsPage() {
  const [reports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    // TODO: Implement reports fetching
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-lg">
        <h2 className="text-headline-lg text-on-surface-dark font-semibold font-inter">
          Monthly Reports
        </h2>
        <p className="text-body-md text-outline mt-xs font-inter">
          Download and manage your monthly timesheet reports
        </p>
      </div>

      {reports.length === 0 ? (
        <div className={clsx(
          'bg-surface-dark-elevated border border-outline-dark rounded-lg p-lg',
          'text-center shadow-subtle'
        )}>
          <div className={clsx(
            'mx-auto mb-md w-16 h-16 bg-primary-500/20 rounded-lg',
            'flex items-center justify-center'
          )}>
            <FileText className="text-primary-400" size={32} />
          </div>
          <p className="text-body-md text-on-surface-dark font-inter">
            No reports generated yet.
          </p>
          <p className="text-body-sm text-outline mt-xs font-inter">
            Reports are automatically generated on the last day of each month.
          </p>
        </div>
      ) : (
        <div className="space-y-md">
          {reports.map((report) => (
            <div
              key={report.id}
              className={clsx(
                'bg-surface-dark-elevated border border-outline-dark rounded-lg p-lg',
                'flex items-center justify-between hover:border-primary-500/30 transition-all duration-200',
                'shadow-subtle'
              )}
            >
              <div className="flex items-center gap-md">
                <div className="p-md bg-primary-500/20 rounded-lg">
                  <FileText className="text-primary-400" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-on-surface-dark font-inter text-body-lg">
                    Monthly Report - Month {report.month}, Year {report.year}
                  </p>
                  <p className="text-body-md text-outline font-inter mt-xs">
                    Generated on {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button className={clsx(
                'bg-primary-500 hover:bg-primary-600 text-white px-md py-sm rounded-md',
                'flex items-center gap-sm transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 focus:ring-offset-surface-dark-base'
              )}>
                <Download size={18} />
                <span className="text-body-md font-medium">Download</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

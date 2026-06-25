import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { apiClient } from '@/services/api';
import Spinner from '@/components/ui/Spinner';
import clsx from 'clsx';


// Derive a tag from the work description
function deriveTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  if (lower.includes('figma') || lower.includes('design') || lower.includes('ui') || lower.includes('ux')) tags.push('#design');
  if (lower.includes('api') || lower.includes('backend') || lower.includes('server') || lower.includes('endpoint')) tags.push('#backend');
  if (lower.includes('frontend') || lower.includes('react') || lower.includes('component') || lower.includes('page')) tags.push('#frontend');
  if (lower.includes('bug') || lower.includes('fix') || lower.includes('issue') || lower.includes('error')) tags.push('#bugfix');
  if (lower.includes('test') || lower.includes('review') || lower.includes('pr') || lower.includes('code')) tags.push('#review');
  if (lower.includes('meeting') || lower.includes('standup') || lower.includes('team') || lower.includes('call')) tags.push('#meeting');
  if (lower.includes('deploy') || lower.includes('release') || lower.includes('prod')) tags.push('#devops');
  if (tags.length === 0) tags.push('#general');
  return tags.slice(0, 2);
}

// Split statusText into title + subtitle
function splitSummary(text: string): { title: string; subtitle: string } {
  if (!text) return { title: '—', subtitle: '' };
  const lines = text.split('\n').map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean);
  if (lines.length === 1) {
    const words = lines[0].split(' ');
    const title = words.slice(0, 5).join(' ');
    const subtitle = words.slice(5).join(' ');
    return { title, subtitle };
  }
  return { title: lines[0], subtitle: lines.slice(1).join(' • ') };
}

export default function MonitorPage() {
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.getMonitorReports(1, 200);
        if (response.data?.success) {
          setAllEntries(response.data.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch monitor reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter logic
  const now = new Date();
  const filtered = allEntries.filter(entry => {
    const text = (entry.statusText || entry.aiSummary || '').toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());

    let matchDate = true;
    const entryDate = new Date(entry.workDate);
    if (dateFilter === 'Last 7 Days') {
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7);
      matchDate = entryDate >= cutoff;
    } else if (dateFilter === 'Last 30 Days') {
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
      matchDate = entryDate >= cutoff;
    } else if (dateFilter === 'This Month') {
      matchDate = entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    }

    const matchStatus =
      statusFilter === 'All Statuses' ||
      (statusFilter === 'Submitted' && entry.workingFlag) ||
      (statusFilter === 'Draft' && !entry.workingFlag);

    return matchSearch && matchDate && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-lg">
        <h2 className="text-headline-lg text-on-surface-dark font-semibold font-inter">My Status Reports</h2>
        <p className="text-body-md text-outline mt-xs font-inter">Overview of your daily status submissions</p>
      </div>

      {/* Toolbar: Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-sm mb-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
          <input
            type="text"
            placeholder="Search summary, tags, or status..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-surface-dark-elevated border border-outline-dark rounded-lg pl-9 pr-4 py-2 text-body-sm text-on-surface-dark placeholder-outline font-inter focus:outline-none focus:border-primary-500/60 transition-colors"
          />
        </div>

        {/* Date filter */}
        <div className="relative">
          <select
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="appearance-none bg-surface-dark-elevated border border-outline-dark rounded-lg pl-4 pr-9 py-2 text-body-sm text-on-surface-dark font-inter focus:outline-none focus:border-primary-500/60 transition-colors cursor-pointer"
          >
            {['All Time', 'Last 7 Days', 'Last 30 Days', 'This Month'].map(o => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="appearance-none bg-surface-dark-elevated border border-outline-dark rounded-lg pl-4 pr-9 py-2 text-body-sm text-on-surface-dark font-inter focus:outline-none focus:border-primary-500/60 transition-colors cursor-pointer"
          >
            {['All Statuses', 'Submitted', 'Draft'].map(o => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-surface-dark-elevated border border-outline-dark rounded-xl p-lg text-center shadow-subtle">
          <div className="mx-auto mb-md w-16 h-16 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <Activity className="text-primary-400" size={32} />
          </div>
          <p className="text-body-md text-on-surface-dark font-inter">No status reports found.</p>
          <p className="text-body-sm text-outline mt-xs font-inter">
            Complete your daily standup in the Chat page to see reports here.
          </p>
        </div>
      ) : (
        <div className="bg-surface-dark-elevated border border-outline-dark rounded-xl shadow-subtle overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-dark">
                <th className="px-5 py-3 text-label-sm text-outline font-semibold uppercase tracking-widest font-inter w-32">Date</th>
                <th className="px-5 py-3 text-label-sm text-outline font-semibold uppercase tracking-widest font-inter">Summary</th>
                <th className="px-5 py-3 text-label-sm text-outline font-semibold uppercase tracking-widest font-inter w-20 text-right">Hours</th>
                <th className="px-5 py-3 text-label-sm text-outline font-semibold uppercase tracking-widest font-inter w-40">Tags</th>
                <th className="px-5 py-3 text-label-sm text-outline font-semibold uppercase tracking-widest font-inter w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((entry) => {
                const { title, subtitle } = splitSummary(entry.statusText || entry.aiSummary || '');
                const tags = deriveTags(entry.statusText || entry.aiSummary || '');
                const submitted = entry.workingFlag;

                return (
                  <tr
                    key={entry.id}
                    className="border-b border-outline-dark/40 hover:bg-white/[0.02] transition-colors duration-150 group"
                  >
                    {/* Date */}
                    <td className="px-5 py-4 align-top">
                      <span className="text-body-sm text-outline font-inter leading-snug whitespace-nowrap">
                        {new Date(entry.workDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </td>

                    {/* Summary */}
                    <td className="px-5 py-4 align-top">
                      <p className="text-body-sm font-semibold text-on-surface-dark font-inter leading-snug">
                        {title}
                      </p>
                      {subtitle && (
                        <p className="text-label-sm text-outline font-inter mt-0.5 leading-snug">
                          {subtitle}
                        </p>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="px-5 py-4 align-top text-right">
                      <span className="text-body-sm font-semibold text-primary-400 font-inter">
                        {entry.hours}h
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-xs">
                        {tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 text-[11px] font-medium font-inter border border-primary-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>


                    {/* Status */}
                    <td className="px-5 py-4 align-top text-center">
                      <span className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold font-inter border',
                        submitted
                          ? 'border-success-500/40 text-success-400 bg-success-500/10'
                          : 'border-outline-dark text-outline bg-surface-dark'
                      )}>
                        {submitted ? 'Submitted' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="px-5 py-3 border-t border-outline-dark/50 flex items-center justify-between bg-surface-dark/30">
            {/* Rows per page dropdown */}
            <div className="flex items-center gap-sm">
              <span className="text-label-sm text-outline font-inter whitespace-nowrap">Rows per page</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-surface-dark-elevated border border-outline-dark/60 rounded-md pl-3 pr-9 py-1.5 text-body-sm text-on-surface-dark font-inter focus:outline-none focus:border-primary-500/60 transition-colors cursor-pointer min-w-[64px]"
                >
                  {[10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <div className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center border-l border-outline-dark/60 pointer-events-none rounded-r-md bg-surface-dark/60">
                </div>
              </div>
            </div>

            {/* Page buttons */}
            <div className="flex items-center gap-xs">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-outline-dark text-outline hover:text-on-surface-dark hover:border-primary-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-outline text-label-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p as number)}
                      className={clsx(
                        'w-7 h-7 rounded text-label-sm font-semibold font-inter transition-colors border',
                        currentPage === p
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-outline-dark text-outline hover:text-on-surface-dark hover:border-primary-500/50'
                      )}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-outline-dark text-outline hover:text-on-surface-dark hover:border-primary-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

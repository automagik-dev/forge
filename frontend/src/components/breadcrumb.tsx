import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useProject } from '@/contexts/project-context';

export function Breadcrumb() {
  const location = useLocation();
  const { projectId, project } = useProject();

  // Determine breadcrumb items based on route
  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'Projects', path: '/projects' }];

    if (projectId && project) {
      crumbs.push({
        label: project.name,
        path: `/projects/${projectId}/tasks`,
      });

      // Add additional segments based on route
      if (location.pathname.includes('/tasks/')) {
        crumbs.push({
          label: 'Task Details',
          path: location.pathname,
        });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Only show breadcrumb if we're in a project context or on projects page
  if (breadcrumbs.length < 2 && !location.pathname.includes('/projects')) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="px-3 py-2 text-sm">
      <ol className="flex items-center gap-1">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Home } from 'lucide-react';
import { useProject } from '@/contexts/project-context';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId, project } = useProject();
  const { data: projects } = useProjects();
  const { taskId } = useParams<{ taskId?: string }>();
  const { tasksById } = useProjectTasks(projectId || '');

  // Determine breadcrumb items based on route
  const getBreadcrumbs = () => {
    const crumbs: Array<{ label: string; path: string }> = [];

    if (projectId && project) {
      // Start with project name (no "Projects" root)
      crumbs.push({
        label: project.name,
        path: `/projects/${projectId}/tasks`,
      });

      // Add task name if we're viewing a task
      if (taskId && tasksById[taskId]) {
        crumbs.push({
          label: tasksById[taskId].title,
          path: location.pathname,
        });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Only show breadcrumb if we're in a project context
  if (!projectId || breadcrumbs.length === 0) {
    return null;
  }

  const handleProjectSwitch = (newProjectId: string) => {
    navigate(`/projects/${newProjectId}/tasks`);
  };

  return (
    <nav aria-label="Breadcrumb" className="px-3 py-2 text-sm">
      <ol className="flex items-center gap-1">
        {/* Home icon to navigate back to project */}
        <li className="flex items-center gap-1">
          <Link
            to={`/projects/${projectId}/tasks`}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Go to project home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {breadcrumbs.map((crumb, index) => {
          const isCurrentProject = projectId && crumb.label === project?.name;
          const isLastCrumb = index === breadcrumbs.length - 1;

          return (
            <li key={crumb.path} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {isCurrentProject ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring rounded-sm px-1 -mx-1">
                    <span className={isLastCrumb ? 'text-foreground font-medium' : ''}>
                      {crumb.label}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-popover">
                    {projects && projects.length > 0 ? (
                      projects.map((proj) => (
                        <DropdownMenuItem
                          key={proj.id}
                          onClick={() => handleProjectSwitch(proj.id)}
                          className={proj.id === projectId ? 'bg-accent' : ''}
                        >
                          <span className="truncate">{proj.name}</span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No projects available
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isLastCrumb ? (
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
          );
        })}
      </ol>
    </nav>
  );
}

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Custom SVG icons
const ChevronRightIcon = () => (
  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const HomeIcon = () => (
  <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

interface BreadcrumbItem {
  label: string;
  path: string;
  isClickable: boolean;
}

interface BreadcrumbProps {
  customItems?: BreadcrumbItem[];
  studentName?: string;    // For dynamic student name in Form 137 editor
  recordName?: string;     // For specific record/entry names
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ customItems, studentName, recordName }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define route mapping for breadcrumbs
  const getRouteMapping = (): Record<string, { label: string; parent?: string }> => ({
    '/': { label: 'Dashboard' },
    '/students': { label: 'Students', parent: '/' },
    '/students/new': { label: 'New Student', parent: '/students' },
    '/teachers': { label: 'Teachers', parent: '/' },
    '/teachers/new': { label: 'New Teacher', parent: '/teachers' },
    '/parents': { label: 'Parents', parent: '/' },
    '/parents/new': { label: 'New Parent', parent: '/parents' },
    '/grades': { label: 'Grades & Reports', parent: '/' },
    '/grades/entry': { label: 'Grade Entry', parent: '/grades' },
    '/grades/form137': { label: 'Permanent Records (Form 137)', parent: '/grades' },
    '/grades/form137/new': { label: 'New Form 137', parent: '/grades/form137' },
    '/sections': { label: 'Sections', parent: '/' },
    '/sections/new': { label: 'New Section', parent: '/sections' },
    '/attendance': { label: 'Attendance', parent: '/' },
    '/settings': { label: 'Settings', parent: '/' },
    '/settings/school': { label: 'School Settings', parent: '/settings' },
    '/settings/users': { label: 'User Management', parent: '/settings' },
    '/substitute': { label: 'Substitute Management', parent: '/' },
    '/scheduler': { label: 'Class Scheduler', parent: '/' },
    '/announcements': { label: 'Announcements', parent: '/' },
    '/core-values': { label: 'Core Values', parent: '/' },
    '/lesson-plans': { label: 'Lesson Plans', parent: '/' },
  });

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems;
    }

    const routeMapping = getRouteMapping();
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Dashboard (Home)
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/',
      isClickable: location.pathname !== '/'
    });

    // Handle dynamic routes (like /grades/form137/:studentId)
    let currentPath = '';
    for (let i = 0; i < pathSegments.length; i++) {
      currentPath += `/${pathSegments[i]}`;
      
      // Check if this is a dynamic ID segment (numeric or alphanumeric ID)
      const isIdSegment = /^[a-zA-Z0-9_-]+$/.test(pathSegments[i]) && 
                         i > 0 && 
                         !routeMapping[currentPath];

      if (isIdSegment) {
        // This is likely an ID parameter, create a specific breadcrumb based on context
        const parentPath = pathSegments.slice(0, i).join('/');
        const parentRoute = routeMapping[`/${parentPath}`] || routeMapping[parentPath];
        
        if (parentRoute) {
          // Determine if this is an edit page or details page
          const isEditPage = pathSegments[i + 1] === 'edit' || 
                           location.pathname.includes('/edit') ||
                           location.search.includes('mode=edit');
          
          // Use provided names if available, otherwise use generic labels
          let label = 'Record Details';
          if (isEditPage) {
            label = recordName ? `Edit ${recordName}` : 'Edit Record';
          } else {
            if (studentName && currentPath.includes('/form137/')) {
              label = studentName;
            } else if (recordName) {
              label = recordName;
            }
          }
          
          breadcrumbs.push({
            label,
            path: currentPath,
            isClickable: false // Current page, not clickable
          });
        }
      } else if (routeMapping[currentPath]) {
        const route = routeMapping[currentPath];
        breadcrumbs.push({
          label: route.label,
          path: currentPath,
          isClickable: i < pathSegments.length - 1 // Not clickable if it's the current page
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumbs on dashboard or if only one item
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4 px-6 py-3 bg-gray-50 border-b border-gray-200" aria-label="Breadcrumb">
      <div className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <ChevronRightIcon />
            )}
            <div className="flex items-center">
              {index === 0 && (
                <HomeIcon />
              )}
              {item.isClickable ? (
                <button
                  onClick={() => handleBreadcrumbClick(item.path)}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 font-medium"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-gray-900 font-semibold">
                  {item.label}
                </span>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumb;
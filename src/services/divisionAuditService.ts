/**
 * Division Audit Service - Logging and querying division-level audit logs
 * 
 * This service provides:
 * - Audit log creation for all division actions
 * - Audit log querying with filters
 * - Export functionality
 * 
 * Performance optimizations:
 * - Fire-and-forget mode: Logging doesn't block UI
 * - Rate limiting: View events are deduplicated within 5 minutes
 * - Non-blocking: Failures don't break the main flow
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 * @see scripts/migration/division-audit-log-schema.sql
 */

import { supabase } from '../lib/supabase';

// =====================================================
// RATE LIMITING CACHE
// =====================================================

/**
 * In-memory cache for rate limiting view events
 * Key: `${userId}-${resourceType}-${resourceName}`
 * Value: timestamp of last log
 */
const viewRateLimitCache = new Map<string, number>();

/**
 * Rate limit duration in milliseconds (5 minutes)
 */
const RATE_LIMIT_MS = 5 * 60 * 1000;

/**
 * Check if a view event should be rate limited
 */
const shouldRateLimitView = (userId: string, resourceType: string, resourceName: string): boolean => {
  const key = `${userId}-${resourceType}-${resourceName}`;
  const lastLogged = viewRateLimitCache.get(key);
  const now = Date.now();
  
  if (lastLogged && (now - lastLogged) < RATE_LIMIT_MS) {
    return true; // Skip logging, within rate limit window
  }
  
  // Update cache with current timestamp
  viewRateLimitCache.set(key, now);
  
  // Clean up old entries periodically (every 100 entries)
  if (viewRateLimitCache.size > 100) {
    const expiredTime = now - RATE_LIMIT_MS;
    for (const [k, v] of viewRateLimitCache.entries()) {
      if (v < expiredTime) {
        viewRateLimitCache.delete(k);
      }
    }
  }
  
  return false;
};

// =====================================================
// TYPES
// =====================================================

/**
 * Action types for audit logging
 */
export type AuditActionType = 
  | 'login'
  | 'logout'
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'generate';

/**
 * Action categories for audit logging
 */
export type AuditActionCategory = 
  | 'auth'
  | 'user_management'
  | 'settings'
  | 'reports'
  | 'schools'
  | 'enrollment'
  | 'personnel'
  | 'dashboard';

/**
 * Resource types for audit logging
 */
export type AuditResourceType = 
  | 'division_user'
  | 'division_settings'
  | 'division'
  | 'school'
  | 'report'
  | 'sf1'
  | 'sf2'
  | 'sf5'
  | 'sf6'
  | 'sf7'
  | 'sf9'
  | 'sf10'
  | 'enrollment_data'
  | 'personnel_data';

/**
 * Status of audit action
 */
export type AuditStatus = 'success' | 'failed' | 'partial';

/**
 * Division Audit Log Entry
 */
export interface DivisionAuditLog {
  id: string;
  division_id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_role?: string;
  action_type: AuditActionType;
  action_category: AuditActionCategory;
  action_description: string;
  resource_type?: AuditResourceType;
  resource_id?: string;
  resource_name?: string;
  school_id?: string;
  school_name?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  status: AuditStatus;
  error_message?: string;
  created_at: string;
}

/**
 * Input for creating an audit log entry
 */
export interface CreateAuditLogInput {
  division_id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_role?: string;
  action_type: AuditActionType;
  action_category: AuditActionCategory;
  action_description: string;
  resource_type?: AuditResourceType;
  resource_id?: string;
  resource_name?: string;
  school_id?: string;
  school_name?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  status?: AuditStatus;
  error_message?: string;
}

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
  division_id: string;
  user_id?: string;
  action_type?: AuditActionType;
  action_category?: AuditActionCategory;
  resource_type?: AuditResourceType;
  school_id?: string;
  status?: AuditStatus;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Paginated audit log response
 */
export interface AuditLogResponse {
  logs: DivisionAuditLog[];
  total: number;
  hasMore: boolean;
}

/**
 * Audit log summary statistics
 */
export interface AuditLogStats {
  total_logs: number;
  logs_today: number;
  logs_this_week: number;
  unique_users: number;
  action_breakdown: { action_type: AuditActionType; count: number }[];
  category_breakdown: { action_category: AuditActionCategory; count: number }[];
  recent_users: { user_id: string; user_name: string; last_action: string }[];
}

// =====================================================
// AUDIT LOG CREATION
// =====================================================

/**
 * Create an audit log entry (fire-and-forget mode)
 * This function logs asynchronously without blocking the caller.
 */
export const createAuditLog = (input: CreateAuditLogInput): void => {
  // Fire-and-forget: don't await, just execute
  (async () => {
    try {
      // Get browser metadata
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

      const { error } = await supabase
        .from('division_audit_logs')
        .insert({
          ...input,
          status: input.status || 'success',
          user_agent: userAgent,
        });

      if (error) {
        console.error('[DivisionAuditService] Error creating audit log:', error);
      }
    } catch (err) {
      console.error('[DivisionAuditService] Exception creating audit log:', err);
    }
  })();
};

/**
 * Log a user login event (fire-and-forget)
 */
export const logLogin = (
  divisionId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userRole: string
): void => {
  createAuditLog({
    division_id: divisionId,
    user_id: userId,
    user_name: userName,
    user_email: userEmail,
    user_role: userRole,
    action_type: 'login',
    action_category: 'auth',
    action_description: `${userName} logged in to the division portal`,
  });
};

/**
 * Log a user logout event (fire-and-forget)
 */
export const logLogout = (
  divisionId: string,
  userId: string,
  userName: string
): void => {
  createAuditLog({
    division_id: divisionId,
    user_id: userId,
    user_name: userName,
    action_type: 'logout',
    action_category: 'auth',
    action_description: `${userName} logged out of the division portal`,
  });
};

/**
 * Log a view action (fire-and-forget with rate limiting)
 * Rate limited: Same view by same user within 5 minutes is skipped
 */
export const logView = (
  divisionId: string,
  userId: string,
  userName: string,
  resourceType: AuditResourceType,
  resourceName: string,
  category: AuditActionCategory,
  schoolId?: string,
  schoolName?: string
): void => {
  // Apply rate limiting for view events
  if (shouldRateLimitView(userId, resourceType, resourceName)) {
    return; // Skip - already logged recently
  }
  
  createAuditLog({
    division_id: divisionId,
    user_id: userId,
    user_name: userName,
    action_type: 'view',
    action_category: category,
    action_description: `${userName} viewed ${resourceName}`,
    resource_type: resourceType,
    resource_name: resourceName,
    school_id: schoolId,
    school_name: schoolName,
  });
};

/**
 * Log a create action (fire-and-forget)
 */
export const logCreate = (
  divisionId: string,
  userId: string,
  userName: string,
  resourceType: AuditResourceType,
  resourceId: string,
  resourceName: string,
  category: AuditActionCategory,
  newData?: Record<string, unknown>
): void => {
  createAuditLog({
    division_id: divisionId,
    user_id: userId,
    user_name: userName,
    action_type: 'create',
    action_category: category,
    action_description: `${userName} created ${resourceType}: ${resourceName}`,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_name: resourceName,
    new_data: newData,
  });
};

/**
 * Log an update action (fire-and-forget)
 */
export const logUpdate = (
  divisionId: string,
  userId: string,
  userName: string,
  resourceType: AuditResourceType,
  resourceId: string,
  resourceName: string,
  category: AuditActionCategory,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
): void => {
  createAuditLog({
    division_id: divisionId,
    user_id: userId,
    user_name: userName,
    action_type: 'update',
    action_category: category,
    action_description: `${userName} updated ${resourceType}: ${resourceName}`,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_name: resourceName,
    old_data: oldData,
    new_data: newData,
  });
};

/**
 * Log a delete action (fire-and-forget)
 */
export const logDelete = (
  divisionId: string,
  userId: string,
  userName: string,
  resourceType: AuditResourceType,
  resourceId: string,
  resourceName: string,
  category: AuditActionCategory,
  oldData?: Record<string, unknown>
): void => {
  createAuditLog({
    division_id: divisionId,
    user_id: userId,
    user_name: userName,
    action_type: 'delete',
    action_category: category,
    action_description: `${userName} deleted ${resourceType}: ${resourceName}`,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_name: resourceName,
    old_data: oldData,
  });
};

/**
 * Log an export action (fire-and-forget)
 */
export const logExport = (
  divisionId: string,
  userId: string,
  userName: string,
  resourceType: AuditResourceType,
  resourceName: string,
  category: AuditActionCategory,
  format: string,
  schoolId?: string,
  schoolName?: string
): void => {
  createAuditLog({
    division_id: divisionId,
    user_id: userId,
    user_name: userName,
    action_type: 'export',
    action_category: category,
    action_description: `${userName} exported ${resourceName} as ${format}`,
    resource_type: resourceType,
    resource_name: resourceName,
    school_id: schoolId,
    school_name: schoolName,
    new_data: { format },
  });
};

/**
 * Log a report generation action (fire-and-forget)
 */
export const logGenerate = (
  divisionId: string,
  userId: string,
  userName: string,
  resourceType: AuditResourceType,
  resourceName: string,
  schoolId?: string,
  schoolName?: string
): void => {
  createAuditLog({
    division_id: divisionId,
    user_id: userId,
    user_name: userName,
    action_type: 'generate',
    action_category: 'reports',
    action_description: `${userName} generated ${resourceName}`,
    resource_type: resourceType,
    resource_name: resourceName,
    school_id: schoolId,
    school_name: schoolName,
  });
};

// =====================================================
// AUDIT LOG QUERIES
// =====================================================

/**
 * Get audit logs with filters and pagination
 */
export const getAuditLogs = async (filters: AuditLogFilters): Promise<AuditLogResponse> => {
  try {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    let query = supabase
      .from('division_audit_logs')
      .select('*', { count: 'exact' })
      .eq('division_id', filters.division_id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.action_type) {
      query = query.eq('action_type', filters.action_type);
    }
    if (filters.action_category) {
      query = query.eq('action_category', filters.action_category);
    }
    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }
    if (filters.school_id) {
      query = query.eq('school_id', filters.school_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }
    if (filters.search) {
      query = query.or(
        `action_description.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%,resource_name.ilike.%${filters.search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[DivisionAuditService] Error fetching audit logs:', error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return {
      logs: (data || []) as DivisionAuditLog[],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (err) {
    console.error('[DivisionAuditService] Exception fetching audit logs:', err);
    throw err;
  }
};

/**
 * Get audit log by ID
 */
export const getAuditLogById = async (id: string): Promise<DivisionAuditLog | null> => {
  try {
    const { data, error } = await supabase
      .from('division_audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[DivisionAuditService] Error fetching audit log:', error);
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }

    return data as DivisionAuditLog;
  } catch (err) {
    console.error('[DivisionAuditService] Exception fetching audit log:', err);
    throw err;
  }
};

/**
 * Get audit log statistics for a division
 */
export const getAuditLogStats = async (divisionId: string): Promise<AuditLogStats> => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get total count
    const { count: totalLogs } = await supabase
      .from('division_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('division_id', divisionId);

    // Get today's count
    const { count: logsToday } = await supabase
      .from('division_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('division_id', divisionId)
      .gte('created_at', todayStart);

    // Get this week's count
    const { count: logsThisWeek } = await supabase
      .from('division_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('division_id', divisionId)
      .gte('created_at', weekStart);

    // Get unique users count
    const { data: uniqueUsersData } = await supabase
      .from('division_audit_logs')
      .select('user_id')
      .eq('division_id', divisionId)
      .gte('created_at', weekStart);
    const uniqueUsers = new Set(uniqueUsersData?.map(d => d.user_id)).size;

    // Get action type breakdown (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: actionData } = await supabase
      .from('division_audit_logs')
      .select('action_type')
      .eq('division_id', divisionId)
      .gte('created_at', thirtyDaysAgo);
    
    const actionCounts = (actionData || []).reduce((acc, log) => {
      acc[log.action_type] = (acc[log.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const actionBreakdown = Object.entries(actionCounts).map(([action_type, count]) => ({
      action_type: action_type as AuditActionType,
      count,
    }));

    // Get category breakdown (last 30 days)
    const { data: categoryData } = await supabase
      .from('division_audit_logs')
      .select('action_category')
      .eq('division_id', divisionId)
      .gte('created_at', thirtyDaysAgo);
    
    const categoryCounts = (categoryData || []).reduce((acc, log) => {
      acc[log.action_category] = (acc[log.action_category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryBreakdown = Object.entries(categoryCounts).map(([action_category, count]) => ({
      action_category: action_category as AuditActionCategory,
      count,
    }));

    // Get recent users
    const { data: recentUsersData } = await supabase
      .from('division_audit_logs')
      .select('user_id, user_name, created_at')
      .eq('division_id', divisionId)
      .order('created_at', { ascending: false })
      .limit(20);

    const seenUsers = new Set<string>();
    const recentUsers = (recentUsersData || [])
      .filter(u => {
        if (seenUsers.has(u.user_id)) return false;
        seenUsers.add(u.user_id);
        return true;
      })
      .slice(0, 5)
      .map(u => ({
        user_id: u.user_id,
        user_name: u.user_name,
        last_action: u.created_at,
      }));

    return {
      total_logs: totalLogs || 0,
      logs_today: logsToday || 0,
      logs_this_week: logsThisWeek || 0,
      unique_users: uniqueUsers,
      action_breakdown: actionBreakdown,
      category_breakdown: categoryBreakdown,
      recent_users: recentUsers,
    };
  } catch (err) {
    console.error('[DivisionAuditService] Exception fetching audit stats:', err);
    throw err;
  }
};

/**
 * Get recent activity for a specific user
 */
export const getUserRecentActivity = async (
  divisionId: string,
  userId: string,
  limit: number = 10
): Promise<DivisionAuditLog[]> => {
  try {
    const { data, error } = await supabase
      .from('division_audit_logs')
      .select('*')
      .eq('division_id', divisionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[DivisionAuditService] Error fetching user activity:', error);
      throw new Error(`Failed to fetch user activity: ${error.message}`);
    }

    return (data || []) as DivisionAuditLog[];
  } catch (err) {
    console.error('[DivisionAuditService] Exception fetching user activity:', err);
    throw err;
  }
};

// =====================================================
// EXPORT UTILITIES
// =====================================================

/**
 * Export audit logs to CSV format
 */
export const exportAuditLogsToCSV = (logs: DivisionAuditLog[]): string => {
  const headers = [
    'Timestamp',
    'User',
    'Role',
    'Action',
    'Category',
    'Description',
    'Resource Type',
    'Resource Name',
    'School',
    'Status',
  ];

  const rows = logs.map(log => [
    new Date(log.created_at).toLocaleString(),
    log.user_name,
    log.user_role || '',
    log.action_type,
    log.action_category,
    log.action_description,
    log.resource_type || '',
    log.resource_name || '',
    log.school_name || '',
    log.status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Download audit logs as CSV file
 */
export const downloadAuditLogsCSV = (logs: DivisionAuditLog[], filename: string = 'audit_logs.csv'): void => {
  const csv = exportAuditLogsToCSV(logs);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default {
  createAuditLog,
  logLogin,
  logLogout,
  logView,
  logCreate,
  logUpdate,
  logDelete,
  logExport,
  logGenerate,
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
  getUserRecentActivity,
  exportAuditLogsToCSV,
  downloadAuditLogsCSV,
};

import { useQuery } from '@tanstack/react-query'
import { getAuditLog, listAuditLogs, type ListAuditLogsParams } from './api'

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (params: ListAuditLogsParams) => [...auditKeys.all, 'list', params] as const,
  detail: (auditId: string) => [...auditKeys.all, 'detail', auditId] as const,
}

export function useAuditLogs(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => listAuditLogs(params),
  })
}

export function useAuditLog(auditId: string | undefined) {
  return useQuery({
    queryKey: auditKeys.detail(auditId ?? ''),
    queryFn: () => getAuditLog(auditId!),
    enabled: Boolean(auditId),
  })
}

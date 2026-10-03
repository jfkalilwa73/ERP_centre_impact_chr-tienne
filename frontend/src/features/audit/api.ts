import { api } from '@/lib/apiClient'
import type { AuditLog, AuditLogPage } from '@/types'

export type ListAuditLogsParams = {
  page?: number
  limit?: number
  compteId?: string
  entiteType?: string
  entiteId?: string
  action?: string
  depuis?: string
  jusqua?: string
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<AuditLogPage> {
  const { data } = await api.get<AuditLogPage>('/audit-logs', { params })
  return data
}

export async function getAuditLog(auditId: string): Promise<AuditLog> {
  const { data } = await api.get<AuditLog>(`/audit-logs/${auditId}`)
  return data
}

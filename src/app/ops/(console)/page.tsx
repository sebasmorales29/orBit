import { OpsConfigNotice } from '@/components/ops/OpsConfigNotice'
import { OpsDashboard } from '@/components/ops/OpsDashboard'
import { OpsSchemaNotice } from '@/components/ops/OpsSchemaNotice'
import { opsCheckSchema, opsGetPlatformStats } from '@/lib/platform/actions'
import { isServiceRoleConfigured } from '@/lib/supabase/env'

export default async function OpsDashboardPage() {
  if (!isServiceRoleConfigured()) {
    return <OpsConfigNotice />
  }

  const schema = await opsCheckSchema()
  if (!schema.ok) {
    return <OpsSchemaNotice missingColumns={schema.missingColumns} sqlFix={schema.sqlFix} />
  }

  const result = await opsGetPlatformStats()

  if (!result.ok) {
    return <p className="text-[14px] text-red-600 dark:text-red-400">{result.message}</p>
  }

  return <OpsDashboard stats={result.stats} />
}

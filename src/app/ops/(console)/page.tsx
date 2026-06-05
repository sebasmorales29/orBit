import { OpsConfigNotice } from '@/components/ops/OpsConfigNotice'
import { OpsDashboard } from '@/components/ops/OpsDashboard'
import { OpsSchemaNotice } from '@/components/ops/OpsSchemaNotice'
import { getPlatformStats } from '@/lib/platform/platform-stats'
import { checkPlatformSchema } from '@/lib/platform/schema-health'
import { isServiceRoleConfigured } from '@/lib/supabase/env'

export default async function OpsDashboardPage() {
  if (!isServiceRoleConfigured()) {
    return <OpsConfigNotice />
  }

  const schema = await checkPlatformSchema()
  if (!schema.ok) {
    return <OpsSchemaNotice missingColumns={schema.missingColumns} sqlFix={schema.sqlFix} />
  }

  const result = await getPlatformStats()

  if (!result.ok) {
    return <p className="text-[14px] text-red-600 dark:text-red-400">{result.message}</p>
  }

  return <OpsDashboard stats={result.stats} />
}

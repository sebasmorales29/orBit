/** Variables de entorno: VELUM_* con fallback ORBIT_* (deploys existentes). */
export function readBrandEnv(suffix: string): string | undefined {
  const velum = process.env[`VELUM_${suffix}`]?.trim()
  if (velum) return velum
  return process.env[`ORBIT_${suffix}`]?.trim()
}

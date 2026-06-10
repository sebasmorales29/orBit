'use client'

import { useState } from 'react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { LandingSection, LandingSectionHeader } from '@/components/landing/landing-layout'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

export function LandingContact() {
  const { t, locale } = useTranslations()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [interest, setInterest] = useState('demo')
  const [message, setMessage] = useState('')
  const [preferredContact, setPreferredContact] = useState('email')
  const [website, setWebsite] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/marketing/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        companyName,
        phone,
        roleTitle,
        teamSize,
        interest,
        message,
        preferredContact,
        locale,
        website,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      toast.error(data.message ?? t('landing.contact.error'))
      return
    }

    setSent(true)
    toast.success(t('landing.contact.success'))
  }

  const selectClass =
    'mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-[14px] text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15'

  if (sent) {
    return (
      <LandingSection id="contacto">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border-subtle bg-surface-raised p-8">
          <h2 className="text-xl font-semibold text-foreground">{t('landing.contact.successTitle')}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{t('landing.contact.successBody')}</p>
        </div>
      </LandingSection>
    )
  }

  return (
    <LandingSection id="contacto">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
        <LandingSectionHeader
          className="lg:col-span-4 lg:sticky lg:top-24"
          label={t('landing.contact.label')}
          title={t('landing.contact.title')}
          intro={t('landing.contact.intro')}
        />

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 space-y-5 rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-[0_8px_32px_rgb(22_24_28/0.06)] sm:p-8 dark:border-border dark:shadow-none"
        >
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={t('landing.contact.fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label={t('landing.contact.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={t('landing.contact.company')}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoComplete="organization"
            />
            <PhoneInput
              label={t('landing.contact.phone')}
              value={phone}
              onChange={setPhone}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={t('landing.contact.role')}
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder={t('landing.contact.rolePlaceholder')}
            />
            <div>
              <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t('landing.contact.teamSize')}
              </label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className={selectClass}
              >
                <option value="">{t('landing.contact.teamSizePlaceholder')}</option>
                <option value="1">{t('landing.contact.team1')}</option>
                <option value="2-5">{t('landing.contact.team2_5')}</option>
                <option value="6-15">{t('landing.contact.team6_15')}</option>
                <option value="16+">{t('landing.contact.team16')}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t('landing.contact.interest')}
              </label>
              <select
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className={selectClass}
              >
                <option value="demo">{t('landing.contact.interestDemo')}</option>
                <option value="info">{t('landing.contact.interestInfo')}</option>
                <option value="pricing">{t('landing.contact.interestPricing')}</option>
                <option value="enterprise">{t('landing.contact.interestEnterprise')}</option>
              </select>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t('landing.contact.preferred')}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
                {(['email', 'whatsapp', 'call'] as const).map((id) => (
                  <label key={id} className="flex cursor-pointer items-center gap-2 text-muted">
                    <input
                      type="radio"
                      name="preferred"
                      value={id}
                      checked={preferredContact === id}
                      onChange={() => setPreferredContact(id)}
                      className="accent-foreground"
                    />
                    {t(`landing.contact.preferred_${id}`)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t('landing.contact.message')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={10}
              rows={5}
              placeholder={t('landing.contact.messagePlaceholder')}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-[14px] text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" className="w-full sm:w-auto" loading={loading}>
              {t('landing.contact.submit')}
            </Button>
            <p className="text-[12px] text-muted-foreground">{t('landing.contact.privacy')}</p>
          </div>
        </form>
      </div>
    </LandingSection>
  )
}

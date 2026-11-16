const TIME_ZONE_KINSHASA = 'Africa/Kinshasa'

function estDimanche(dateCulte: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateCulte) && new Date(`${dateCulte}T12:00:00.000Z`).getUTCDay() === 0
}

export function estChecklistVerrouillee(dateCulte: string, maintenant = new Date()) {
  if (!estDimanche(dateCulte)) return false

  const parties = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE_KINSHASA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(maintenant)
  const valeur = Object.fromEntries(parties.map(({ type, value }) => [type, value]))
  const dateLocaleKinshasa = `${valeur.year}-${valeur.month}-${valeur.day}`

  return dateCulte < dateLocaleKinshasa || (dateCulte === dateLocaleKinshasa && Number(valeur.hour) >= 8)
}

export function dateVerrouillageChecklist(dateCulte: string) {
  // Kinshasa est à UTC+1 : 08 h locale correspond à 07 h UTC.
  return new Date(`${dateCulte}T07:00:00.000Z`).toISOString()
}

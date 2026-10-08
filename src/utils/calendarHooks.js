import { useEffect, useState } from 'react'
import { currentTimeZone, dayKey, msUntilNextMidnight, zoneOffset } from './calendar.js'

// What a finished Daily records about when it was finished: the instant
// (UTC), and the local date and UTC offset at that moment. The puzzle's own
// date is stored separately as its key.
export function finishStamp(now = Date.now()) {
  return {
    completedAt: new Date(now).toISOString(),
    completedDay: dayKey(now),
    completedOffset: Math.round(zoneOffset(now) / 60000),
  }
}

function read() {
  return { key: dayKey(), tz: currentTimeZone() }
}

// The player's current calendar date and time zone, kept current: it updates
// at local midnight, when the tab is shown again or focused (after sleeping
// past midnight or changing time zones), and once a minute while visible.
export function useToday() {
  const [today, setToday] = useState(read)
  useEffect(() => {
    let timer = 0
    const check = () => {
      const next = read()
      setToday((cur) => (cur.key === next.key && cur.tz === next.tz ? cur : next))
    }
    const schedule = () => {
      clearTimeout(timer)
      // A moment after midnight, so the new date is certain to have started.
      timer = setTimeout(() => {
        check()
        schedule()
      }, Math.min(msUntilNextMidnight() + 1000, 6 * 3600000))
    }
    const onShow = () => {
      if (document.visibilityState === 'visible') {
        check()
        schedule()
      }
    }
    schedule()
    const minute = setInterval(() => {
      if (document.visibilityState === 'visible') check()
    }, 60000)
    document.addEventListener('visibilitychange', onShow)
    window.addEventListener('focus', onShow)
    window.addEventListener('pageshow', onShow)
    return () => {
      clearTimeout(timer)
      clearInterval(minute)
      document.removeEventListener('visibilitychange', onShow)
      window.removeEventListener('focus', onShow)
      window.removeEventListener('pageshow', onShow)
    }
  }, [])
  return today
}

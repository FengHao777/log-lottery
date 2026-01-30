import FingerprintJS from '@fingerprintjs/fingerprintjs'

const DEVICE_FINGERPRINT_KEY = 'lottery_device_fingerprint'
const COOKIE_KEY = 'lottery_device_cookie'

/**
 * 获取或生成设备指纹
 * 使用FingerprintJS生成设备指纹，并存储到LocalStorage和Cookies中
 */
export async function getDeviceFingerprint(): Promise<string> {
  // 先尝试从LocalStorage获取
  const storedFingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY)
  if (storedFingerprint) {
    return storedFingerprint
  }

  // 尝试从Cookies获取
  const cookieFingerprint = getCookie(COOKIE_KEY)
  if (cookieFingerprint) {
    localStorage.setItem(DEVICE_FINGERPRINT_KEY, cookieFingerprint)
    return cookieFingerprint
  }

  // 生成新的设备指纹
  const fp = await FingerprintJS.load()
  const result = await fp.get()
  const fingerprint = result.visitorId

  // 存储到LocalStorage
  localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint)

  // 存储到Cookies（设置1年过期）
  setCookie(COOKIE_KEY, fingerprint, 365)

  return fingerprint
}

/**
 * 设置Cookie
 */
function setCookie(name: string, value: string, days: number): void {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

/**
 * 获取Cookie
 */
function getCookie(name: string): string | null {
  const nameEQ = `${name}=`
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ')
      c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0)
      return c.substring(nameEQ.length, c.length)
  }
  return null
}

/**
 * 清除设备指纹（用于测试）
 */
export function clearDeviceFingerprint(): void {
  localStorage.removeItem(DEVICE_FINGERPRINT_KEY)
  document.cookie = `${COOKIE_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}

/**
 * 获取设备IP地址（如果需要）
 * 注意：这需要后端支持，纯前端无法获取真实IP
 */
export async function getDeviceIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  }
  catch (error) {
    console.error('获取IP地址失败:', error)
    return ''
  }
}

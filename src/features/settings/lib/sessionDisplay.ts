function pickBrowserLabel(ua: string | null | undefined): string {
  if (!ua) {
    return "—";
  }
  if (/Edg\//i.test(ua)) {
    return "Edge";
  }
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) {
    return "Chrome";
  }
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    return "Safari";
  }
  if (/Firefox\//i.test(ua)) {
    return "Firefox";
  }
  return "Trình duyệt khác";
}

export function formatBrowserLabel(
  browser: string | null | undefined,
  userAgent: string | null | undefined): string {
  if (browser && browser.trim().length > 0) {
    return browser;
  }
  return pickBrowserLabel(userAgent);
}

export function formatLocation(
  location: { city?: string | null; country?: string | null } | null | undefined): string {
  if (!location) {
    return "—";
  }
  const city = location.city?.trim();
  const country = location.country?.trim();
  if (city && country) {
    return `${city}, ${country}`;
  }
  if (city) {
    return city;
  }
  if (country) {
    return country;
  }
  return "—";
}

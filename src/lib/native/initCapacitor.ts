import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return

  await StatusBar.setStyle({ style: Style.Default })
}

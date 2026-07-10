import {
  MessagesSquare, Coins, Landmark, Hammer, MapPin, Trophy,
  FileCheck2, Banknote, Building2, Handshake, Receipt, PiggyBank,
  LineChart, Home, type LucideIcon,
} from 'lucide-react'
import type { IconKey } from '@/lib/forumsData'

const MAP: Record<IconKey, LucideIcon> = {
  messages: MessagesSquare,
  coins: Coins,
  landmark: Landmark,
  hammer: Hammer,
  mapPin: MapPin,
  trophy: Trophy,
  fileCheck: FileCheck2,
  banknote: Banknote,
  building2: Building2,
  handshake: Handshake,
  receipt: Receipt,
  piggyBank: PiggyBank,
  lineChart: LineChart,
  home: Home,
}

export function ForumIcon({ icon, className }: { icon: IconKey; className?: string }) {
  const Icon = MAP[icon] ?? MessagesSquare
  return <Icon className={className} aria-hidden />
}

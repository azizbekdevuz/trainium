import { 
  PartyPopper, Package, DollarSign, Users, ShoppingBag, 
  AlertTriangle, BarChart3, Image, CreditCard, CheckCircle, 
  XCircle, Undo2, Sun, Moon, Lock, User, ParkingCircle, 
  Smartphone, Mail, Phone, Home, ArrowRight, ArrowLeft, 
  ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight, 
  ArrowUpLeft, ArrowDownLeft, Frown, Meh, Smile, Zap, 
  Star, Brain, Lightbulb, Clock, Truck, X, 
  Check, ExternalLink, ShoppingCart, Wifi, WifiOff,
  Bell, Search, Filter, Plus, Loader2, ChevronLeft, 
  ChevronRight, AlertCircle, Send, Loader, Menu, Globe
} from 'lucide-react';

export const Icons = {
  // Status & Actions
  celebration: PartyPopper,
  package: Package,
  money: DollarSign,
  users: Users,
  shopping: ShoppingBag,
  warning: AlertTriangle,
  analytics: BarChart3,
  image: Image,
  payment: CreditCard,
  success: CheckCircle,
  error: XCircle,
  undo: Undo2,
  
  // Theme & UI
  sun: Sun,
  moon: Moon,
  lock: Lock,
  user: User,
  parking: ParkingCircle,
  phone: Smartphone,
  email: Mail,
  call: Phone,
  home: Home,
  
  // Navigation
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  arrowUpRight: ArrowUpRight,
  arrowDownRight: ArrowDownRight,
  arrowUpLeft: ArrowUpLeft,
  arrowDownLeft: ArrowDownLeft,
  
  // Fitness Characters
  frown: Frown,
  meh: Meh,
  smile: Smile,
  zap: Zap,
  star: Star,
  brain: Brain,
  lightbulb: Lightbulb,
  
  // Order Timeline
  clock: Clock,
  truck: Truck,
  cancel: X,
  check: Check,
  
  // Common UI
  externalLink: ExternalLink,
  shoppingCart: ShoppingCart,
  wifi: Wifi,
  wifiOff: WifiOff,
  bell: Bell,
  search: Search,
  filter: Filter,
  plus: Plus,
  loader: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  alertCircle: AlertCircle,
  send: Send,
  loading: Loader,
  menu: Menu,
  globe: Globe,
};

export type IconName = keyof typeof Icons;

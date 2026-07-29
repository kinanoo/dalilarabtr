/**
 * One slug → lucide-icon map for the service taxonomy, shared by the category
 * landing pages, the profession×city pages, and the /services browse grid so
 * every surface uses the same icon for a profession. Kept next to
 * serviceCategories.ts (the taxonomy) — add an entry here whenever you add a
 * category there; `catIcon` falls back to Briefcase for anything unmapped.
 */
import type { ElementType } from 'react';
import {
    Briefcase, Stethoscope, Smile, Scale, Languages, Home, GraduationCap, Sparkles,
    Scissors, ShieldCheck, Car, UtensilsCrossed, Package, Ship, Calculator, HardHat,
    Droplets, Zap, Hammer, Snowflake, Truck, SprayCan, WashingMachine, Plane,
    Wrench, Paintbrush, KeyRound, Wifi, Smartphone, Printer, ShoppingBag,
    CarFront, UsersRound,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, ElementType> = {
    doctors: Stethoscope,
    dentists: Smile,
    lawyers: Scale,
    translators: Languages,
    'real-estate': Home,
    education: GraduationCap,
    beauty: Sparkles,
    barber: Scissors,
    insurance: ShieldCheck,
    cars: Car,
    restaurants: UtensilsCrossed,
    cargo: Package,
    customs: Ship,
    accounting: Calculator,
    contractors: HardHat,
    plumbing: Droplets,
    electrical: Zap,
    carpentry: Hammer,
    hvac: Snowflake,
    moving: Truck,
    cleaning: SprayCan,
    'appliance-repair': WashingMachine,
    tourism: Plane,
    'home-maintenance': Wrench,
    'finishing-decor': Paintbrush,
    'locksmith-metalwork': KeyRound,
    'telecom-internet': Wifi,
    'phones-computers': Smartphone,
    'printing-design': Printer,
    'retail-supplies': ShoppingBag,
    'transport-taxi': CarFront,
    employment: UsersRound,
    general: Briefcase,
};

export const catIcon = (slug: string): ElementType => CATEGORY_ICONS[slug] || Briefcase;

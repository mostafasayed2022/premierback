import {
  Heart,
  ShieldCheck,
  Accessibility,
  Stethoscope,
  Activity,
  FlaskConical,
  Home,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

export const SITE_CONFIG = {
  name: "PremierCare Sanctuary",
  description:
    "Clinical excellence delivered with the warmth of digital hospitality. We bridge the gap between hospital-grade care and personal comfort.",
  contact: {
    phone: "1-800-PREMIER",
    email: "care@premiercare.com",
    address: "PremierCare HQ, New York",
    whatsapp: "+1 (555) 000-0000",
  },
  workingHours: {
    weekdays: "08:00 AM - 08:00 PM",
    saturday: "09:00 AM - 05:00 PM",
    sunday: "Emergency Only",
  },
};

export const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "About Us", href: "#about" },
  { label: "Reviews", href: "#reviews" },
];

export const CORE_VALUES = [
  {
    title: "Compassion",
    description:
      "We treat every home as a sanctuary. Care is delivered with empathy, dignity, and a deep respect for personal boundaries.",
    icon: Heart,
    color: "bg-teal-100 text-teal-600",
  },
  {
    title: "Excellence",
    description:
      "Rigorous clinical standards meet artisanal service. We refuse to compromise on the surgical precision of our medical protocols.",
    icon: ShieldCheck,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Accessibility",
    description:
      "Top-tier healthcare should not be a luxury. We strive to make professional home-care available to diverse communities through smart tech.",
    icon: Accessibility,
    color: "bg-orange-100 text-orange-600",
  },
];

export const SERVICES = [
  {
    id: "nursing",
    title: "Home Nursing Care",
    description: "Professional registered nurses providing 24/7 care...",
    price: "120",
    icon: Stethoscope,
    category: "Home Care",
  },
  {
    id: "physical-therapy",
    title: "Physical Therapy",
    description: "Personalized rehabilitation programs to restore...",
    price: "85",
    icon: Activity,
    category: "Therapy",
  },
  {
    id: "lab-tests",
    title: "Lab Tests at Home",
    description: "Quick, painless sample collection and accurate...",
    price: "45",
    icon: FlaskConical,
    category: "Diagnostics",
  },
  {
    id: "doctor-visit",
    title: "Doctor Home Visit",
    description: "General practitioners and specialists available for...",
    price: "150",
    icon: Users,
    category: "Home Care",
  },
  {
    id: "post-surgery",
    title: "Post-Surgery Care",
    description: "Comprehensive recovery support including...",
    price: "200",
    icon: CheckCircle2,
    category: "Home Care",
  },
  {
    id: "elderly-care",
    title: "Elderly Care",
    description: "Dignified support for seniors focusing on...",
    price: "90",
    icon: Calendar,
    category: "Home Care",
  },
  {
    id: "medical-equipment",
    title: "Medical Equipment",
    description: "Rental of high-grade hospital beds, oxygen...",
    price: "30/day",
    icon: Home,
    category: "Diagnostics",
  },
  {
    id: "mental-health",
    title: "Mental Health Support",
    description: "Confidential counseling and therapy sessions with...",
    price: "110",
    icon: TrendingUp,
    category: "Therapy",
  },
];

export const TEAM = [
  {
    name: "Dr. Sarah Chen",
    role: "Chief Executive Officer",
    image: "/team/sarah.jpg",
  },
  {
    name: "Jameson Miller",
    role: "Chief Medical Officer",
    image: "/team/jameson.jpg",
  },
  {
    name: "Elena Rodriguez",
    role: "Director of Nursing",
    image: "/team/elena.jpg",
  },
  {
    name: "Marcus Thorne",
    role: "VP of Operations",
    image: "/team/marcus.jpg",
  },
];

export const TIMELINE = [
  {
    year: "2018",
    title: "Founded in Cairo",
    label:
      "Premier Health Clinics launched at Fairmont Nile City focusing on luxury wellness and clinical IV nutrition.",
  },
  {
    year: "2019",
    title: "First 1000 Patients",
    label:
      "Reached a milestone in patient success stories, maintaining a 90% satisfaction rating.",
  },
  {
    year: "2021",
    title: "Expanded Nationwide",
    label:
      "Opened clinical hubs in 15 major states, streamlining home-healthcare logistics through proprietary tech.",
  },
  {
    year: "Today",
    title: "Global Standard",
    label:
      "Managing over 250,000 active patient profiles with a network of 2,000+ certified specialists.",
  },
];

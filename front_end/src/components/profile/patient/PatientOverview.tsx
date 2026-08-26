"use client";

import { PatientProfile } from "@/lib/types";
import { useAppointments } from "@/lib/api/hooks";
import { Link } from "@/i18n/routing";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  Headphones,
  CheckCircle2,
  CalendarPlus,
  PhoneCall,
} from "lucide-react";
import { T } from "@/i18n/T";

// ─── Types ────────────────────────────────────────────────────────────────

interface PatientOverviewProps {
  patient: PatientProfile;
}

// ─── Sub-components ───────────────────────────────────────────────────────

interface InfoItemProps {
  icon: React.ElementType;
  label: React.ReactNode;
  value?: React.ReactNode;
  iconColor?: string;
  badge?: React.ReactNode;
}

function InfoItem({
  icon: Icon,
  label,
  value,
  iconColor = "#c8a96b",
  badge,
}: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f7f2ea]/60 border border-[#e8e0d5]/60 hover:bg-[#f7f2ea] transition-colors">
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-[#e8e0d5]/80 shadow-2xs">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] text-[#959ead] font-medium block leading-tight">
          {label}
        </span>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-[#1e293b] truncate">
            {value ?? "—"}
          </span>
          {badge}
        </div>
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  icon: React.ElementType;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  iconBg = "#eef2f5",
  iconColor = "#385366",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-[#e8e0d5]">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#1e293b] leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-[#959ead] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function PatientOverview({ patient }: PatientOverviewProps) {
  const { data: appointments } = useAppointments();

  // Find next upcoming / confirmed visit
  const upcomingAppointment = appointments?.find((apt) => {
    const s = apt.status.toLowerCase();
    return s === "confirmed" || s === "upcoming" || s === "pending";
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* ── Left Column: Personal & Account Profile Details ── */}
      <div className="lg:col-span-6 space-y-5">
        <div className="bg-white border border-[#e8e0d5] rounded-3xl p-6 sm:p-7 shadow-xs">
          <SectionHeader
            icon={User}
            title={
              <T
                en="Personal Information"
                ar="المعلومات الشخصية"
                de="Persönliche Informationen"
                es="Información Personal"
                fr="Informations Personnelles"
                it="Informazioni Personali"
                tr="Kişisel Bilgiler"
                ru="Личная информация"
              />
            }
            subtitle={
              <T
                en="Your registered identity and account details"
                ar="بيانات هويتك وحسابك المسجلة في النظام"
                de="Ihre registrierten Identitäts- und Kontodaten"
                es="Sus datos de identidad y cuenta registrados"
                fr="Vos informations d'identité et de compte enregistrées"
                it="I tuoi dati identificativi e dell'account registrati"
                tr="Kayıtlı kimlik ve hesap bilgileriniz"
                ru="Ваши зарегистрированные данные и учетная запись"
              />
            }
            iconBg="#eef2f5"
            iconColor="#385366"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <InfoItem
              icon={User}
              label={
                <T
                  en="Full Name"
                  ar="الاسم الكامل"
                  de="Vollständiger Name"
                  es="Nombre Completo"
                  fr="Nom Complet"
                  it="Nome Completo"
                  tr="Tam Adı"
                  ru="Полное имя"
                />
              }
              value={patient.fullName}
            />

            <InfoItem
              icon={Mail}
              label={
                <T
                  en="Email Address"
                  ar="البريد الإلكتروني"
                  de="E-Mail-Adresse"
                  es="Correo Electrónico"
                  fr="Adresse Email"
                  it="Indirizzo Email"
                  tr="E-posta Adresi"
                  ru="Электронная почта"
                />
              }
              value={patient.email}
            />

            <InfoItem
              icon={Phone}
              label={
                <T
                  en="Phone Number"
                  ar="رقم الهاتف"
                  de="Telefonnummer"
                  es="Número de Teléfono"
                  fr="Numéro de Téléphone"
                  it="Numero di Telefono"
                  tr="Telefon Numarası"
                  ru="Номер телефона"
                />
              }
              value={patient.phone || "—"}
            />

            <InfoItem
              icon={Calendar}
              label={
                <T
                  en="Date of Birth"
                  ar="تاريخ الميلاد"
                  de="Geburtsdatum"
                  es="Fecha de Nacimiento"
                  fr="Date de Naissance"
                  it="Data di Nascita"
                  tr="Doğum Tarihi"
                  ru="Дата рождения"
                />
              }
              value={patient.dateOfBirth || "—"}
            />

            <InfoItem
              icon={User}
              label={
                <T
                  en="Gender"
                  ar="النوع / الجنس"
                  de="Geschlecht"
                  es="Género"
                  fr="Genre"
                  it="Genere"
                  tr="Cinsiyet"
                  ru="Пол"
                />
              }
              value={
                patient.gender
                  ? patient.gender.charAt(0).toUpperCase() +
                    patient.gender.slice(1)
                  : "—"
              }
            />

            <InfoItem
              icon={ShieldCheck}
              iconColor="#2d7a55"
              label={
                <T
                  en="Account Status"
                  ar="حالة الحساب"
                  de="Kontostatus"
                  es="Estado de la Cuenta"
                  fr="Statut du Compte"
                  it="Stato dell'Account"
                  tr="Hesap Durumu"
                  ru="Статус аккаунта"
                />
              }
              value={
                <T
                  en="Active & Verified"
                  ar="نشط وموثق"
                  de="Aktiv & Verifiziert"
                  es="Activo y Verificado"
                  fr="Actif & Vérifié"
                  it="Attivo e Verificato"
                  tr="Aktif ve Doğrulanmış"
                  ru="Активен и подтвержден"
                />
              }
              badge={
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              }
            />
          </div>
        </div>
      </div>

      {/* ── Right Column: Dynamic Upcoming Visit & VIP Support ── */}
      <div className="lg:col-span-6 space-y-5">
        {/* 1. Next Upcoming Visit Card */}
        <div className="bg-white border border-[#e8e0d5] rounded-3xl p-6 sm:p-7 shadow-xs">
          <SectionHeader
            icon={Calendar}
            title={
              <T
                en="Upcoming Consultation"
                ar="الموعد الطبي القادم"
                de="Anstehende Konsultation"
                es="Próxima Consulta"
                fr="Prochaine Consultation"
                it="Prossima Consultazione"
                tr="Gelecek Konsültasyon"
                ru="Предстоящая консультация"
              />
            }
            subtitle={
              <T
                en="Your next scheduled visit with our specialist"
                ar="موعد زيارتك القادمة المجدولة مع أخصائينا"
                de="Ihr nächster geplanter Besuch bei unserem Spezialisten"
                es="Su próxima visita programada con nuestro especialista"
                fr="Votre prochaine visite prévue avec notre spécialiste"
                it="La tua prossima visita programmata con il nostro specialista"
                tr="Uzmanımızla planlanan bir sonraki ziyaretiniz"
                ru="Ваш следующий запланированный визит к специалисту"
              />
            }
            iconBg="#edf7ee"
            iconColor="#2d7a55"
          />

          {upcomingAppointment ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#f7f2ea] to-[#fff8ee] border border-[#e8d5a8] space-y-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#1e293b]">
                  {upcomingAppointment.service}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {upcomingAppointment.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#385366]">
                <Stethoscope className="w-4 h-4 text-[#c8a96b]" />
                <span>
                  <T
                    en="Doctor:"
                    ar="الطبيب:"
                    de="Arzt:"
                    es="Médico:"
                    fr="Médecin:"
                    it="Medico:"
                    tr="Doktor:"
                    ru="Врач:"
                  />{" "}
                  <strong>{upcomingAppointment.doctor}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#4a5568] pt-1">
                <div className="flex items-center gap-1.5 bg-white/70 p-2 rounded-xl border border-[#e8d5a8]/40">
                  <Calendar className="w-3.5 h-3.5 text-[#c8a96b]" />
                  <span className="font-medium">
                    {upcomingAppointment.date}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/70 p-2 rounded-xl border border-[#e8d5a8]/40">
                  <Clock className="w-3.5 h-3.5 text-[#c8a96b]" />
                  <span className="font-medium">
                    {upcomingAppointment.time}
                  </span>
                </div>
              </div>

              {upcomingAppointment.branch && (
                <div className="flex items-center gap-1.5 text-xs text-[#4a5568] bg-white/70 p-2 rounded-xl border border-[#e8d5a8]/40">
                  <MapPin className="w-3.5 h-3.5 text-[#c8a96b]" />
                  <span className="font-medium truncate">
                    {upcomingAppointment.branch}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-[#f7f2ea]/60 border border-[#e8e0d5] space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center mx-auto text-[#c8a96b] shadow-2xs border border-[#e8e0d5]">
                <CalendarPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#1e293b]">
                  <T
                    en="No Upcoming Visits Scheduled"
                    ar="لا توجد مواعيد قادمة مجدولة"
                    de="Keine anstehenden Termine geplant"
                    es="No hay citas próximas programadas"
                    fr="Aucun rendez-vous à venir"
                    it="Nessun appuntamento futuro programmato"
                    tr="Planlanmış Gelecek Randevu Yok"
                    ru="Нет запланированных предстоящих визитов"
                  />
                </p>
                <p className="text-[11px] text-[#959ead] mt-0.5 max-w-xs mx-auto">
                  <T
                    en="Book your next consultation with our elite medical specialists."
                    ar="احجز استشارتك القادمة مع نخبة من كبار الأطباء والاستشاريين."
                    de="Buchen Sie Ihre nächste Konsultation bei unseren Spezialisten."
                    es="Reserve su próxima consulta con nuestros especialistas médicos de élite."
                    fr="Réservez votre prochaine consultation avec nos spécialistes d'élite."
                    it="Prenota la tua prossima visita con i nostri specialisti medici d'élite."
                    tr="Seçkin tıp uzmanlarımızla bir sonraki randevunuzu alın."
                    ru="Запишитесь на прием к нашим ведущим медицинским специалистам."
                  />
                </p>
              </div>
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-90 shadow-sm cursor-pointer"
                style={{ backgroundColor: "#385366" }}
              >
                <T
                  en="Book New Consultation"
                  ar="حجز استشارة جديدة"
                  de="Neue Konsultation buchen"
                  es="Reservar nueva consulta"
                  fr="Réserver une consultation"
                  it="Prenota nuova visita"
                  tr="Yeni Randevu Al"
                  ru="Записаться на прием"
                />
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* 2. VIP Concierge Support & Quick Links Card */}
        <div className="bg-white border border-[#e8e0d5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <SectionHeader
            icon={Headphones}
            title={
              <T
                en="Dedicated Patient Support"
                ar="الدعم والمساعدة الطبية"
                de="Engagierter Patientenservice"
                es="Atención al Paciente"
                fr="Service d'Assistance Patient"
                it="Assistenza Pazienti Dedicata"
                tr="Özel Hasta Desteği"
                ru="Поддержка пациентов"
              />
            }
            subtitle={
              <T
                en="Direct contact with our medical assistance team"
                ar="تواصل مباشر مع فريق المساعدة والاستقبال الطبي"
                de="Direkter Kontakt zu unserem medizinischen Betreuungsteam"
                es="Contacto directo con nuestro equipo de asistencia médica"
                fr="Contact direct avec notre équipe d'assistance médicale"
                it="Contatto diretto con il nostro team di assistenza medica"
                tr="Tıbbi destek ekibimizle doğrudan iletişim"
                ru="Прямая связь с нашей медицинской службой"
              />
            }
            iconBg="#fff8ee"
            iconColor="#a38448"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Phone hotline */}
            <a
              href="tel:+201200644663"
              className="flex items-center gap-3 p-3 rounded-2xl bg-[#f7f2ea]/60 border border-[#e8e0d5]/60 hover:bg-[#f7f2ea] transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#c8a96b] border border-[#e8e0d5]/80 group-hover:scale-105 transition-transform shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#959ead] font-medium block">
                  <T
                    en="VIP Concierge Call"
                    ar="الاتصال الهاتفي"
                    de="VIP-Anruf"
                    es="Llamada VIP"
                    fr="Appel VIP"
                    it="Chiamata VIP"
                    tr="VIP Arama"
                    ru="VIP звонок"
                  />
                </span>
                <span
                  className="font-bold text-[#1e293b] group-hover:text-[#385366] transition-colors"
                  dir="ltr"
                >
                  +20 12 0064 4663
                </span>
              </div>
            </a>

            {/* Email Support */}
            <a
              href="mailto:info@premierhealthclinics.com"
              className="flex items-center gap-3 p-3 rounded-2xl bg-[#f7f2ea]/60 border border-[#e8e0d5]/60 hover:bg-[#f7f2ea] transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#c8a96b] border border-[#e8e0d5]/80 group-hover:scale-105 transition-transform shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#959ead] font-medium block">
                  <T
                    en="Email Concierge"
                    ar="البريد الإلكتروني"
                    de="E-Mail"
                    es="Correo"
                    fr="Email"
                    it="Email"
                    tr="E-posta"
                    ru="Эл. почта"
                  />
                </span>
                <span className="font-bold text-[#1e293b] group-hover:text-[#385366] transition-colors truncate block">
                  info@premierhealthclinics.com
                </span>
              </div>
            </a>
          </div>

          {/* Working hours badge */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#fff8ee] border border-[#e8d5a8] text-xs text-[#4a5568]">
            <Clock className="w-4 h-4 text-[#a38448] shrink-0" />
            <span className="text-[11px] font-medium leading-relaxed">
              <T
                en="Clinic Hours: Mon – Sat, 9:00 AM – 9:00 PM (Emergency care available 24/7)"
                ar="مواعيد العمل: السبت إلى الخميس، 9:00 ص – 9:00 م (خدمة الطوارئ متوفرة على مدار الساعة)"
                de="Öffnungszeiten: Mo – Sa, 9:00 – 21:00 Uhr (Notfallversorgung 24/7)"
                es="Horario: Lun – Sáb, 9:00 AM – 9:00 PM (Atención de urgencias 24/7)"
                fr="Horaires: Lun – Sam, 9h00 – 21h00 (Urgences disponibles 24/7)"
                it="Orari: Lun – Sab, 9:00 – 21:00 (Assistenza per emergenze 24/7)"
                tr="Çalışma Saatleri: Pzt – Cmt, 09:00 – 21:00 (7/24 Acil bakım hizmeti)"
                ru="Часы работы: Пн – Сб, 9:00 – 21:00 (Круглосуточная неотложная помощь)"
              />
            </span>
          </div>

          {/* Quick shortcuts */}
          <div className="flex items-center justify-between pt-2 border-t border-[#e8e0d5] text-xs">
            <Link
              href="/doctors"
              className="font-semibold text-[#385366] hover:text-[#c8a96b] transition-colors inline-flex items-center gap-1"
            >
              <T
                en="Explore Doctors"
                ar="تصفح الأطباء"
                de="Ärzte entdecken"
                es="Ver médicos"
                fr="Explorer les médecins"
                it="Esplora medici"
                tr="Doktorları İncele"
                ru="Наши врачи"
              />
              <ArrowRight className="w-3 h-3" />
            </Link>

            <Link
              href="/departments"
              className="font-semibold text-[#385366] hover:text-[#c8a96b] transition-colors inline-flex items-center gap-1"
            >
              <T
                en="Medical Departments"
                ar="الأقسام الطبية"
                de="Abteilungen"
                es="Departamentos"
                fr="Départements"
                it="Dipartimenti"
                tr="Tıbbi Bölümler"
                ru="Отделения"
              />
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

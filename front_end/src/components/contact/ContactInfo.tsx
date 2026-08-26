"use client";

import { useLocale, useTranslations } from "next-intl";
import { Phone, Mail, MapPin, Share2 } from "lucide-react";

/* ─── Brand SVG Icons ───────────────────────────────────────────────── */

function WhatsappIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#E4405F">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function ThreadsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 192 192" fill="#000000">
      <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.643 32.788 28.08 19.882 44.485 13.224 67.315 13.001 96c.223 28.685 6.88 51.515 19.788 67.92 14.504 18.437 36.094 27.885 64.184 28.08h.113c24.96-.173 42.554-6.708 57.048-21.053 18.937-18.81 18.392-42.213 12.142-56.695-4.567-10.646-13.228-19.232-24.739-24.264Zm-43.099 43.051c-10.422.588-21.258-4.099-21.808-14.082-.38-7.017 4.96-14.832 21.253-15.76 1.86-.107 3.687-.16 5.48-.16 6.47 0 12.542.617 18.013 1.779-2.05 25.613-12.564 27.686-22.938 28.223Z" />
    </svg>
  );
}

function TiktokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#000000">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.29-2.61.74-5.26 2.69-7.01 1.68-1.52 3.98-2.26 6.24-1.95v4.27c-1.15-.22-2.37.03-3.33.68-.96.65-1.55 1.74-1.58 2.9-.06 1.34.61 2.65 1.75 3.32 1.13.67 2.58.64 3.67-.08.82-.54 1.33-1.44 1.4-2.42.06-2.15.02-4.31.03-6.46V.02z" />
    </svg>
  );
}

function SnapchatIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#FFFC00">
      <path d="M12.065.001C8.71-.026 5.563 1.67 3.857 4.408 2.97 5.832 2.56 7.473 2.602 9.13c-.001.84.09 1.68.275 2.5-.317.15-.647.265-.985.344-.36.09-.726.15-1.095.179a1.39 1.39 0 0 0-.489.1.834.834 0 0 0-.5.76c.018.386.277.72.645.836.132.04.266.072.401.096.586.118 1.155.311 1.69.573.247.14.462.33.633.558.048.083.072.177.069.271a.637.637 0 0 1-.072.242c-.37.805-.827 1.566-1.362 2.268-.524.668-1.14 1.26-1.829 1.757C-.18 19.849-.12 20.558.376 20.93c.208.155.46.236.717.232.196 0 .39-.04.571-.118.483-.194.973-.373 1.472-.517a7.2 7.2 0 0 1 1.674-.252c.269 0 .534.024.797.072.558.12 1.08.37 1.521.726.73.556 1.59.938 2.5 1.117.336.06.677.088 1.018.086.338.001.676-.03 1.009-.09a6.49 6.49 0 0 0 2.499-1.11c.443-.36.966-.61 1.526-.73.263-.048.53-.072.797-.073a7.204 7.204 0 0 1 1.674.253c.499.144.99.323 1.472.517.514.218 1.11.034 1.42-.44.305-.48.208-1.116-.226-1.481a10.26 10.26 0 0 1-1.828-1.757 12.47 12.47 0 0 1-1.363-2.268.578.578 0 0 1-.07-.242.454.454 0 0 1 .07-.271 2.25 2.25 0 0 1 .634-.558 6.777 6.777 0 0 1 1.69-.573c.134-.024.269-.055.4-.096a1.023 1.023 0 0 0 .646-.836.835.835 0 0 0-.5-.76 1.378 1.378 0 0 0-.489-.1 7.64 7.64 0 0 1-1.095-.178 4.515 4.515 0 0 1-.985-.345c.184-.82.276-1.659.274-2.5.006-1.674-.384-3.327-1.137-4.822C17.178 1.56 14.7.02 12.065.001Z" />
    </svg>
  );
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LinktreeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#43E55E">
      <path d="M7.953 15.066c-.08.163-.08.324-.08.486.08.891.647 1.458 1.54 1.458H11v4.58c0 .243 0 .405.081.567.162.648.81 1.052 1.458.97.648-.082 1.134-.648 1.134-1.296v-4.82h1.62c.891 0 1.54-.567 1.62-1.377v-.243c0-.162-.081-.324-.081-.486L13.9 8.977l2.754-2.916c.567-.567.567-1.458 0-2.025-.243-.243-.567-.405-.89-.405-.324 0-.648.162-.892.405L12 6.952l-2.835-2.92c-.243-.242-.567-.404-.89-.404-.325 0-.649.162-.892.405-.567.567-.567 1.458 0 2.025l2.754 2.916-3.184 6.092z" />
    </svg>
  );
}

/* ─── Component ─────────────────────────────────────────────────────── */

export function ContactInfo() {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const isAr = locale === "ar";

  const staticBranches = [
    {
      id: "fairmont",
      name: isAr ? "فرع فيرمونت نايل سيتي" : "Premier Health Fairmont Nile City",
      phone: "+20 12 0064 4663",
      phoneRaw: "+201200644663",
      address: t("fairmontAddress") || "Fairmont Nile City, Cairo",
      mapEmbed:
        "https://maps.google.com/maps?q=30.0719202,31.2275839&z=15&output=embed",
      link: "https://www.google.com/maps/place/Premier+Health/@30.0719202,31.2275839,17z/data=!3m1!4b1!4m6!3m5!1s0x1458413b92031a19:0xe4dfaac55744481b!8m2!3d30.0719202!4d31.2275839",
    },
    {
      id: "arkan",
      name: isAr ? "فرع أركان بلازا (الشيخ زايد)" : "Arkan Plaza (Sheikh Zayed)",
      phone: "+20 12 0064 4663",
      phoneRaw: "+201200644663",
      address: t("arkanAddress") || "Arkan Plaza, Sheikh Zayed",
      mapEmbed:
        "https://maps.google.com/maps?q=30.0194029,31.0045291&z=15&output=embed",
      link: "https://www.google.com/maps/place/Arkan+Plaza/@30.0194029,31.0045291,17z/data=!3m1!4b1!4m6!3m5!1s0x14585b0525c31285:0xe916bcf3ee2db2ad!8m2!3d30.0194029!4d31.0045291",
    },
    {
      id: "sodic",
      name: isAr ? "فرع سوديك EDNC (التجمع الخامس)" : "EDNC Sodic (New Cairo)",
      phone: "+20 12 0064 4663",
      phoneRaw: "+201200644663",
      address: t("sodicAddress") || "EDNC Sodic, Fifth Settlement",
      mapEmbed:
        "https://maps.google.com/maps?q=2G87%2B5RC,%20Eastown,%20New%20Cairo%201&z=15&output=embed",
      link: "https://www.google.com/maps?q=2G87+5RC+D+solutions,+Eastown,+New+Cairo+1,+Cairo+Governorate",
    },
  ];

  const topCards = [
    {
      icon: Phone,
      title: t("formPhone") || "Call Center",
      lines: [
        {
          text: isAr
            ? "مركز الاتصال: +20 12 0064 4663"
            : "Call Center: +20 12 0064 4663",
          link: "tel:+201200644663",
        },
      ],
      color: "border-accent/20 bg-accent/5 text-accent",
    },
    {
      icon: Mail,
      title: t("email") || "Email",
      lines: [
        {
          text: "info@premierhealthclinics.com",
          link: "mailto:info@premierhealthclinics.com",
        },
      ],
      color: "border-primary/20 bg-primary/5 text-primary",
    },
  ];

  const socialLinks = [
    {
      href: "https://wa.me/201200644663",
      icon: WhatsappIcon,
      label: "WhatsApp",
    },
    {
      href: "https://www.instagram.com/premierhealth.clinics",
      icon: InstagramIcon,
      label: "Instagram",
    },
    {
      href: "https://www.facebook.com/premierecareclinics",
      icon: FacebookIcon,
      label: "Facebook",
    },
    {
      href: "https://www.threads.net/@premierhealth.clinics",
      icon: ThreadsIcon,
      label: "Threads",
    },
    {
      href: "https://www.tiktok.com/@premierhealthclinics",
      icon: TiktokIcon,
      label: "TikTok",
    },
    {
      href: "https://www.snapchat.com/@premier.health?share_id=inVm7XArR_w&locale=en-GB",
      icon: SnapchatIcon,
      label: "Snapchat",
    },
    {
      href: "https://www.google.com/search?client=safari&hl=en-eg&q=Premier+Care&ludocid=16492088125003417627",
      icon: GoogleIcon,
      label: "Google Business",
      fullWidth: true,
    },
    {
      href: "https://linktr.ee/premierhealthclinic",
      icon: LinktreeIcon,
      label: "Linktree Portal",
      fullWidth: true,
      highlight: true,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top info cards — Phone & Email */}
      <div className="grid sm:grid-cols-2 gap-4">
        {topCards.map((c, i) => {
          const IconComponent = c.icon;
          return (
            <div
              key={i}
              className="group flex flex-col gap-3 p-6 rounded-3xl bg-white border border-accent/15 shadow-sm hover:shadow-md hover:shadow-accent/5 hover:border-accent/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-colors duration-300 ${c.color} group-hover:bg-accent group-hover:text-white group-hover:border-accent shadow-sm`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-primary text-lg mb-1 group-hover:text-accent transition-colors">
                  {c.title}
                </h4>
                <div className="flex flex-col gap-1">
                  {c.lines.map((l, idx) => (
                    <a
                      key={idx}
                      href={l.link}
                      className="block text-sm text-foreground/80 hover:text-accent transition-colors font-medium"
                    >
                      {l.text}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Static Branches with Maps */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
          <MapPin className="text-accent w-5 h-5" />
          {t("locations") || "Locations"}
        </h3>

        <div className="grid gap-4">
          {staticBranches.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-3xl bg-white border border-accent/15 shadow-sm hover:border-accent/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h4 className="font-bold text-primary text-base">{b.name}</h4>
                <a
                  href={`tel:${b.phoneRaw}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{b.phone}</span>
                </a>
              </div>
              <a
                href={b.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-foreground/70 mb-4 font-medium hover:text-accent transition-colors"
              >
                {b.address}
              </a>
              <div className="w-full h-48 rounded-xl overflow-hidden border border-accent/20 grayscale hover:grayscale-0 transition-all duration-500">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={b.mapEmbed}
                  allowFullScreen
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Links Card */}
      <div className="p-6 rounded-3xl bg-white border border-accent/15 shadow-sm hover:shadow-md hover:shadow-primary/5 transition-all duration-300 mt-2">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-accent/10">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-primary text-lg">
              {isAr ? "تابعنا على" : "Connect With Us"}
            </h4>
            <p className="text-sm text-foreground/70 font-medium mt-0.5">
              {isAr ? "منصات التواصل الاجتماعي الرسمية" : "Official Social Media Channels"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {socialLinks.map(({ href, icon: Icon, label, fullWidth, highlight }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={`text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 rounded-xl p-3.5 active:scale-95 ${
                fullWidth ? "col-span-2" : ""
              } ${
                highlight
                  ? "text-white bg-primary hover:bg-accent border-transparent shadow-md shadow-primary/20 tracking-wider uppercase"
                  : "text-primary hover:text-accent border border-accent/10 bg-beige/30 hover:bg-beige hover:border-accent/30"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

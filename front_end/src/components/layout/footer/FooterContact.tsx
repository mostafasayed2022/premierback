import { useTranslations } from "next-intl";
import { MapPin, Phone, Mail, MessageSquare } from "lucide-react";

/* ─── Brand SVG Icons ───────────────────────────────────────────────── */

function LinktreeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.953 15.066c-.08.163-.08.324-.08.486.08.891.647 1.458 1.54 1.458H11v4.58c0 .243 0 .405.081.567.162.648.81 1.052 1.458.97.648-.082 1.134-.648 1.134-1.296v-4.82h1.62c.891 0 1.54-.567 1.62-1.377v-.243c0-.162-.081-.324-.081-.486L13.9 8.977l2.754-2.916c.567-.567.567-1.458 0-2.025-.243-.243-.567-.405-.89-.405-.324 0-.648.162-.892.405L12 6.952l-2.835-2.92c-.243-.242-.567-.404-.89-.404-.325 0-.649.162-.892.405-.567.567-.567 1.458 0 2.025l2.754 2.916-3.184 6.092z" />
    </svg>
  );
}

function ThreadsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 192 192" fill="currentColor">
      <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.643 32.788 28.08 19.882 44.485 13.224 67.315 13.001 96c.223 28.685 6.88 51.515 19.788 67.92 14.504 18.437 36.094 27.885 64.184 28.08h.113c24.96-.173 42.554-6.708 57.048-21.053 18.937-18.81 18.392-42.213 12.142-56.695-4.567-10.646-13.228-19.232-24.739-24.264Zm-43.099 43.051c-10.422.588-21.258-4.099-21.808-14.082-.38-7.017 4.96-14.832 21.253-15.76 1.86-.107 3.687-.16 5.48-.16 6.47 0 12.542.617 18.013 1.779-2.05 25.613-12.564 27.686-22.938 28.223Z" />
    </svg>
  );
}

function TiktokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.29-2.61.74-5.26 2.69-7.01 1.68-1.52 3.98-2.26 6.24-1.95v4.27c-1.15-.22-2.37.03-3.33.68-.96.65-1.55 1.74-1.58 2.9-.06 1.34.61 2.65 1.75 3.32 1.13.67 2.58.64 3.67-.08.82-.54 1.33-1.44 1.4-2.42.06-2.15.02-4.31.03-6.46V.02z" />
    </svg>
  );
}

function SnapchatIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.065.001C8.71-.026 5.563 1.67 3.857 4.408 2.97 5.832 2.56 7.473 2.602 9.13c-.001.84.09 1.68.275 2.5-.317.15-.647.265-.985.344-.36.09-.726.15-1.095.179a1.39 1.39 0 0 0-.489.1.834.834 0 0 0-.5.76c.018.386.277.72.645.836.132.04.266.072.401.096.586.118 1.155.311 1.69.573.247.14.462.33.633.558.048.083.072.177.069.271a.637.637 0 0 1-.072.242c-.37.805-.827 1.566-1.362 2.268-.524.668-1.14 1.26-1.829 1.757C-.18 19.849-.12 20.558.376 20.93c.208.155.46.236.717.232.196 0 .39-.04.571-.118.483-.194.973-.373 1.472-.517a7.2 7.2 0 0 1 1.674-.252c.269 0 .534.024.797.072.558.12 1.08.37 1.521.726.73.556 1.59.938 2.5 1.117.336.06.677.088 1.018.086.338.001.676-.03 1.009-.09a6.49 6.49 0 0 0 2.499-1.11c.443-.36.966-.61 1.526-.73.263-.048.53-.072.797-.073a7.204 7.204 0 0 1 1.674.253c.499.144.99.323 1.472.517.514.218 1.11.034 1.42-.44.305-.48.208-1.116-.226-1.481a10.26 10.26 0 0 1-1.828-1.757 12.47 12.47 0 0 1-1.363-2.268.578.578 0 0 1-.07-.242.454.454 0 0 1 .07-.271 2.25 2.25 0 0 1 .634-.558 6.777 6.777 0 0 1 1.69-.573c.134-.024.269-.055.4-.096a1.023 1.023 0 0 0 .646-.836.835.835 0 0 0-.5-.76 1.378 1.378 0 0 0-.489-.1 7.64 7.64 0 0 1-1.095-.178 4.515 4.515 0 0 1-.985-.345c.184-.82.276-1.659.274-2.5.006-1.674-.384-3.327-1.137-4.822C17.178 1.56 14.7.02 12.065.001Z" />
    </svg>
  );
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 15.987 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

/* ─── Component ─────────────────────────────────────────────────────── */

export function FooterContact() {
  const t = useTranslations();

  const socialLinks = [
    {
      href: "https://linktr.ee/premierhealthclinic?utm_source=ig&utm_medium=social&utm_content=link_in_bio",
      icon: LinktreeIcon,
      label: "Linktree",
    },
    {
      href: "https://www.threads.com/@premierhealth.clinics",
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
      href: "https://www.google.com/search?client=safari&hl=en-eg&q=Premier+Health+Clinics&ludocid=16492088125003417627",
      icon: GoogleIcon,
      label: "Google Listing",
      fullWidth: true,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-serif text-sm uppercase tracking-wider text-accent font-semibold border-b border-white/10 pb-2">
        {t("Contact.info")}
      </h4>
      <div className="flex flex-col gap-3 text-xs text-slate-300">
        {/* Addresses */}
        <div className="flex items-start gap-2.5">
          <MapPin size={16} className="text-accent shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <a
              href="https://www.google.com/maps/place/Premier+Health/@30.0719202,31.2275839,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              {t("Contact.fairmontAddress") || "Fairmont Nile City, Cairo"}
            </a>
            <a
              href="https://www.google.com/maps/place/Arkan+Plaza/@30.0194029,31.0045291,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              {t("Contact.arkanAddress") || "Arkan Plaza, Sheikh Zayed"}
            </a>
            <a
              href="https://www.google.com/maps?q=2G87+5RC+D+solutions,+Eastown,+New+Cairo+1,+Cairo+Governorate"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              {t("Contact.sodicAddress") || "EDNC Sodic, Fifth Settlement"}
            </a>
          </div>
        </div>

        {/* Call Center Number */}
        <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Phone size={13} className="text-accent shrink-0" />
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
              {t("Contact.callCenter") || "Call Center"}
            </span>
          </div>
          <a
            href="tel:+201200644663"
            className="group flex items-center justify-between gap-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent/30 px-3 py-2 transition-all duration-200"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
              <span className="text-[10px] text-white/60 group-hover:text-white/80 truncate transition-colors leading-tight">
                {t("Contact.callCenterLabel") || "Premier Health Call Center"}
              </span>
            </div>
            <span
              dir="ltr"
              className="text-[11px] font-bold text-white group-hover:text-accent transition-colors shrink-0 tabular-nums"
            >
              +20 12 0064 4663
            </span>
          </a>
        </div>


        {/* Email */}
        <div className="flex items-center gap-2.5">
          <Mail size={15} className="text-accent shrink-0" />
          <a href="mailto:info@premierhealthclinics.com" className="hover:text-accent transition-colors">
            info@premierhealthclinics.com
          </a>
        </div>

        {/* WhatsApp CTA */}
        <a
          href="https://wa.me/201200644663"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white py-2 text-xs font-bold transition-all duration-300 shadow-md"
        >
          <MessageSquare size={14} />
          <span>{t("Contact.whatsapp")}</span>
        </a>

        {/* Social Links Grid — with real icons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          {socialLinks.map(({ href, icon: Icon, label, fullWidth }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              aria-label={label}
              className={`flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white py-2 text-[11px] font-bold transition-all duration-300 border border-white/10 hover:border-accent/30 hover:text-accent${fullWidth ? " col-span-2" : ""}`}
            >
              <Icon className="w-3.5 h-3.5 fill-current" />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

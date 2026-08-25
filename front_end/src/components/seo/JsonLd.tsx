import React from "react";
import { SITE_URL } from "@/lib/seo";

interface JsonLdProps {
  locale: string;
}

export function JsonLd({ locale }: JsonLdProps) {
  const isAr = locale === "ar";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalOrganization",
        "@id": `${SITE_URL}/#organization`,
        name: isAr ? "عيادات بريمير هيلث" : "Premier Health Clinics",
        alternateName: [
          "Premier Health",
          "Premier Health Clinic",
          "Premier Care Clinics",
          "بريمير هيلث",
          "عيادات بريمير هيلث",
        ],
        url: `${SITE_URL}/${locale}`,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo/logo.webp`,
          width: 512,
          height: 512,
        },
        image: `${SITE_URL}/logo/logo.webp`,
        description: isAr
          ? "الوجهة الأولى للرعاية الصحية الفاخرة، باقات العلاج والتقطير الوريدي IV Therapy، الجلدية، والتجميل في القاهرة والشيخ زايد والتجمع الخامس."
          : "Leading luxury medical & wellness clinics offering advanced IV drip therapy, dermatology, NAD+ infusions, and aesthetic medicine in Cairo, Egypt.",
        email: "info@premierhealthclinics.com",
        telephone: "+201200644663",
        priceRange: "$$$",
        medicalSpecialty: [
          "Dermatology",
          "Aesthetic Medicine",
          "Intravenous Therapy",
          "Regenerative Medicine",
          "Longevity & Anti-Aging",
        ],
        availableLanguage: [
          { "@type": "Language", name: "Arabic", iso6391Code: "ar" },
          { "@type": "Language", name: "English", iso6391Code: "en" },
          { "@type": "Language", name: "French", iso6391Code: "fr" },
          { "@type": "Language", name: "German", iso6391Code: "de" },
          { "@type": "Language", name: "Spanish", iso6391Code: "es" },
          { "@type": "Language", name: "Italian", iso6391Code: "it" },
          { "@type": "Language", name: "Turkish", iso6391Code: "tr" },
          { "@type": "Language", name: "Russian", iso6391Code: "ru" },
        ],
        sameAs: [
          "https://www.instagram.com/premierhealth.clinics",
          "https://www.facebook.com/premierecareclinics",
          "https://www.threads.net/@premierhealth.clinics",
          "https://www.tiktok.com/@premierhealthclinics",
          "https://www.snapchat.com/@premier.health?share_id=inVm7XArR_w&locale=en-GB",
          "https://linktr.ee/premierhealthclinic",
          "https://wa.me/201200644663",
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: isAr ? "خدمات وعلاجات بريمير هيلث" : "Premier Health Treatments",
          itemListElement: [
            {
              "@type": "OfferCatalog",
              name: "IV Therapy Packages",
              itemListElement: [
                { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "NAD+ Longevity Drip" } },
                { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Myers Wellness Cocktail" } },
                { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Immunity Booster Infusion" } },
                { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Glow & Radiance Drip" } },
                { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Athletic Recovery Drip" } },
              ],
            },
            {
              "@type": "OfferCatalog",
              name: "Dermatology & Aesthetics",
              itemListElement: [
                { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Skin Rejuvenation & Peeling" } },
                { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Botox & Dermal Fillers" } },
                { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Hair Restoration Therapy" } },
              ],
            },
          ],
        },
        department: [
          {
            "@type": "MedicalClinic",
            name: isAr ? "فرع فيرمونت نايل سيتي" : "Premier Health - Fairmont Nile City",
            telephone: "+201200644663",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Fairmont Nile City Hotel & Towers, Corniche El Nil",
              addressLocality: "Cairo",
              addressRegion: "Cairo Governorate",
              addressCountry: "EG",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "30.0719202",
              longitude: "31.2275839",
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
                opens: "10:00",
                closes: "22:00",
              },
            ],
          },
          {
            "@type": "MedicalClinic",
            name: isAr ? "فرع أركان بلازا (الشيخ زايد)" : "Premier Health - Arkan Plaza (Sheikh Zayed)",
            telephone: "+201111977713",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Arkan Plaza, El-Bostan St",
              addressLocality: "Sheikh Zayed City",
              addressRegion: "Giza Governorate",
              addressCountry: "EG",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "30.0194029",
              longitude: "31.0045291",
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
                opens: "10:00",
                closes: "22:00",
              },
            ],
          },
          {
            "@type": "MedicalClinic",
            name: isAr ? "فرع سوديك EDNC (التجمع الخامس)" : "Premier Health - EDNC Sodic (New Cairo)",
            telephone: "+201111977712",
            address: {
              "@type": "PostalAddress",
              streetAddress: "EDNC Eastown District New Cairo, Sodic, Road 90",
              addressLocality: "New Cairo",
              addressRegion: "Cairo Governorate",
              addressCountry: "EG",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "30.0142",
              longitude: "31.4728",
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
                opens: "10:00",
                closes: "22:00",
              },
            ],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Premier Health Clinics",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/${locale}/services?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

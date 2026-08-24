import axios from "axios";

/**
 * Detect current locale from URL path or document element.
 * Defaults to 'ar' to provide optimal experience for Arabic users.
 */
export function getCurrentLocale(): string {
  if (typeof window !== "undefined") {
    const pathSegment = window.location.pathname.split("/")[1];
    if (
      ["ar", "en", "de", "fr", "it", "es", "ru", "tr"].includes(pathSegment)
    ) {
      return pathSegment;
    }
    if (
      document.documentElement.lang &&
      ["ar", "en", "de", "fr", "it", "es", "ru", "tr"].includes(
        document.documentElement.lang,
      )
    ) {
      return document.documentElement.lang;
    }
  }
  return "ar";
}

// ─── Status Code User-Friendly Messages ───────────────────────────────────────

const STATUS_MESSAGES: Record<number, Record<string, string>> = {
  400: {
    ar: "تعذر إتمام العملية، يرجى مراجعة البيانات المدخلة والتأكد من صحتها ثم المحاولة مجدداً.",
    en: "Unable to process the request. Please verify the information and try again.",
    de: "Ungültige Anfrage. Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.",
    fr: "Impossible de traiter la demande. Veuillez vérifier les informations et réessayer.",
    es: "No se pudo procesar la solicitud. Verifique la información e intente nuevamente.",
    it: "Impossibile elaborare la richiesta. Verifica le informazioni e riprova.",
    ru: "Не удалось обработать запрос. Пожалуйста, проверьте данные и повторите попытку.",
    tr: "İşlem tamamlanamadı. Lütfen girdiğiniz bilgileri kontrol edip tekrar deneyin.",
  },
  401: {
    ar: "انتهت صلاحية الجلسة أو يجب تسجيل الدخول للمتابعة.",
    en: "Your session has expired. Please log in again to continue.",
    de: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
    fr: "Votre session a expiré. Veuillez vous reconnecter pour continuer.",
    es: "Su sesión ha expirado. Inicie sesión nuevamente para continuar.",
    it: "La sessione è scaduta. Accedi di nuovo per continuare.",
    ru: "Срок действия сеанса истек. Пожалуйста, войдите снова.",
    tr: "Oturumunuzun süresi doldu. Devam etmek için lütfen tekrar giriş yapın.",
  },
  403: {
    ar: "عفواً، ليس لديك الصلاحية الكافية للقيام بهذا الإجراء.",
    en: "You do not have permission to perform this action.",
    de: "Sie haben keine Berechtigung für diese Aktion.",
    fr: "Vous n'avez pas la permission d'effectuer cette action.",
    es: "No tienes permiso para realizar esta acción.",
    it: "Non hai i permessi necessari per questa azione.",
    ru: "У вас нет прав для выполнения этого действия.",
    tr: "Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.",
  },
  404: {
    ar: "عفواً، العنصر أو الصفحة المطلوبة غير متوفرة حالياً.",
    en: "The requested resource was not found.",
    de: "Die angeforderte Ressource wurde nicht gefunden.",
    fr: "La ressource demandée est introuvable.",
    es: "El recurso solicitado no fue encontrado.",
    it: "La risorsa richiesta non è stata trovata.",
    ru: "Запрашиваемый ресурс не найден.",
    tr: "İstenen kaynak bulunamadı.",
  },
  409: {
    ar: "يوجد تعارض في البيانات، قد يكون الموعد أو الحساب مسجلاً مسبقاً بالفعل.",
    en: "Data conflict. The booking slot or account may already exist.",
    de: "Datenkonflikt. Der Termin oder das Konto existiert möglicherweise bereits.",
    fr: "Conflit de données. Le créneau ou le compte existe peut-être déjà.",
    es: "Conflicto de datos. El horario o la cuenta ya pueden existir.",
    it: "Conflitto di dati. Lo slot o l'account potrebbe già esistere.",
    ru: "Конфликт данных. Запись или аккаунт уже существуют.",
    tr: "Veri çakışması. Randevu saati veya hesap zaten mevcut olabilir.",
  },
  413: {
    ar: "حجم الملف أو الصورة المرفوعة كبير جداً، يرجى اختيار ملف أصغر حجماً.",
    en: "The uploaded file is too large. Please choose a smaller file.",
    de: "Die hochgeladene Datei ist zu groß.",
    fr: "Le fichier téléchargé est trop volumineux.",
    es: "El archivo subido es demasiado grande.",
    it: "Il file caricato è troppo grande.",
    ru: "Загруженный файл слишком большой.",
    tr: "Yüklenen dosya çok büyük.",
  },
  422: {
    ar: "يرجى التأكد من صحة واكتمال جميع الحقول المطلوبة والمحاولة مرة أخرى.",
    en: "Validation failed. Please ensure all required fields are correctly filled.",
    de: "Validierung fehlgeschlagen. Bitte überprüfen Sie Ihre Angaben.",
    fr: "Validation échouée. Veuillez vérifier les champs requis.",
    es: "Validación fallida. Verifique que los campos requeridos estén completos.",
    it: "Validazione fallita. Assicurati che tutti i campi siano corretti.",
    ru: "Ошибка валидации. Проверьте правильность заполнения полей.",
    tr: "Doğrulama başarısız. Lütfen gerekli tüm alanları kontrol edin.",
  },
  429: {
    ar: "تم إجراء محاولات متكررة في وقت قصير، يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.",
    en: "Too many requests. Please wait a few minutes before trying again.",
    de: "Zu viele Anfragen. Bitte warten Sie einige Minuten.",
    fr: "Trop de tentatives. Veuillez patienter quelques minutes.",
    es: "Demasiados intentos. Espere unos minutos antes de volver a intentarlo.",
    it: "Troppi tentativi. Attendi qualche minuto prima di riprovare.",
    ru: "Слишком много попыток. Пожалуйста, подождите несколько минут.",
    tr: "Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.",
  },
  500: {
    ar: "حدث خطأ في الخادم أثناء معالجة طلبك، نحن نعمل على إصلاحه حالياً. يرجى المحاولة مرة أخرى بعد قليل أو التواصل مع خدمة العملاء.",
    en: "A server error occurred while processing your request. Please try again in a few moments or contact our support team.",
    de: "Ein unerwarteter Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie unseren Support.",
    fr: "Une erreur serveur inattendue est survenue. Veuillez réessayer plus tard ou contacter le support.",
    es: "Ocurrió un error inesperado en el servidor. Por favor, inténtelo de nuevo más tarde o contacte a soporte.",
    it: "Si è verificato un errore imprevisto del server. Riprova più tardi o contatta il supporto.",
    ru: "Произошла непредвиденная ошибка сервера. Пожалуйста, повторите попытку позже или обратитесь в службу поддержки.",
    tr: "Sunucuda beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin veya müşteri hizmetleriyle iletişime geçin.",
  },
  502: {
    ar: "الخادم غير متاح حالياً بسبب التحديثات أو الصيانة، يرجى إعادة المحاولة بعد لحظات.",
    en: "The server is temporarily unavailable. Please try again shortly.",
    de: "Der Server ist vorübergehend nicht erreichbar. Bitte versuchen Sie es in Kürze erneut.",
    fr: "Le serveur est temporairement indisponible. Veuillez réessayer sous peu.",
    es: "El servidor no está disponible temporalmente. Inténtelo de nuevo en breve.",
    it: "Il server è temporaneamente non disponibile. Riprova a breve.",
    ru: "Сервер временно недоступен. Пожалуйста, повторите попытку через несколько минут.",
    tr: "Sunucu geçici olarak kullanılamıyor. Lütfen kısa süre sonra tekrar deneyin.",
  },
  503: {
    ar: "الخدمة غير متوفرة مؤقتاً، نحن نعمل على استعادتها. يرجى المحاولة بعد قليل.",
    en: "Service temporarily unavailable. Please try again in a few moments.",
    de: "Der Dienst ist vorübergehend nicht verfügbar. Bitte versuchen Sie es gleich erneut.",
    fr: "Service temporairement indisponible. Veuillez réessayer dans quelques instants.",
    es: "Servicio temporalmente no disponible. Inténtelo de nuevo en unos momentos.",
    it: "Servizio temporaneamente non disponibile. Riprova tra qualche istante.",
    ru: "Служба временно недоступна. Пожалуйста, повторите попытку через несколько минут.",
    tr: "Hizmet geçici olarak kullanım dışı. Lütfen birazdan tekrar deneyin.",
  },
  504: {
    ar: "استغرق الخادم وقتاً أطول من المعتاد للرد، يرجى إعادة المحاولة.",
    en: "The server took too long to respond (Gateway Timeout). Please try again.",
    de: "Zeitüberschreitung der Anforderung. Bitte versuchen Sie es erneut.",
    fr: "Le serveur a mis trop de temps à répondre. Veuillez réessayer.",
    es: "El servidor tardó demasiado en responder. Inténtelo de nuevo.",
    it: "Il server ha impiegato troppo tempo per rispondere. Riprova.",
    ru: "Время ожидания ответа сервера истекло. Пожалуйста, повторите попытку.",
    tr: "Sunucu yanıt vermede zaman aşımına uğradı. Lütfen tekrar deneyin.",
  },
};

// ─── Network & Generic Messages ───────────────────────────────────────────────

const NETWORK_MESSAGES: Record<string, string> = {
  ar: "تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.",
  en: "Unable to connect to the server. Please check your internet connection and try again.",
  de: "Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.",
  fr: "Impossible de se connecter au serveur. Veuillez vérifier votre connexion Internet.",
  es: "No se puede conectar al servidor. Verifique su conexión a Internet.",
  it: "Impossibile connettersi al server. Verifica la connessione a Internet.",
  ru: "Не удалось подключиться к серверу. Пожалуйста, проверьте подключение к Интернету.",
  tr: "Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.",
};

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  ar: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
  en: "An unexpected error occurred. Please try again.",
  de: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
  fr: "Une erreur inattendue est survenue. Veuillez réessayer.",
  es: "Ocurrió un error inesperado. Por favor, inténtelo de nuevo.",
  it: "Si è verificato un errore imprevisto. Riprova.",
  ru: "Произошла непредвиденная ошибка. Пожалуйста, повторите попытку.",
  tr: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
};

// ─── Common Backend Text Translations to Arabic ──────────────────────────────

const COMMON_TRANSLATIONS_AR: Array<{ pattern: RegExp; translation: string }> = [
  {
    pattern: /No active account found with the given credentials/i,
    translation: "البريد الإلكتروني أو كلمة المرور غير صحيحة، يرجى التأكد والمحاولة مجدداً.",
  },
  {
    pattern: /Unable to log in with provided credentials/i,
    translation: "بيانات تسجيل الدخول غير صحيحة، يرجى التأكد والمحاولة مرة أخرى.",
  },
  {
    pattern: /user with this email( address)? already exists/i,
    translation: "هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.",
  },
  {
    pattern: /user with that username already exists/i,
    translation: "اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.",
  },
  {
    pattern: /user with this phone( number)? already exists/i,
    translation: "رقم الهاتف هذا مسجل مسبقاً في النظام.",
  },
  {
    pattern: /phone number already registered/i,
    translation: "رقم الهاتف هذا مسجل مسبقاً في النظام.",
  },
  {
    pattern: /Given token not valid for any token type|token_not_valid|token is invalid or expired/i,
    translation: "انتهت صلاحية الجلسة أو الرمز، يرجى تسجيل الدخول أو إعادة المحاولة.",
  },
  {
    pattern: /Invalid (OTP|verification code)/i,
    translation: "رمز التحقق (OTP) غير صحيح أو منتهي الصلاحية، يرجى التأكد وإعادة المحاولة.",
  },
  {
    pattern: /This field is required/i,
    translation: "هذا الحقل مطلوب، يرجى إدخال البيانات.",
  },
  {
    pattern: /Ensure this field has at least (\d+) characters/i,
    translation: "يجب ألا يقل هذا الحقل عن $1 أحرف.",
  },
  {
    pattern: /Passwords? do(es)? not match/i,
    translation: "كلمتا المرور غير متطابقتين، يرجى التأكد من كتابتهما بشكل متطابق.",
  },
  {
    pattern: /Enter a valid email address/i,
    translation: "يرجى إدخال بريد إلكتروني صالح (مثال: name@example.com).",
  },
  {
    pattern: /Enter a valid phone number/i,
    translation: "يرجى إدخال رقم هاتف صحيح ومكتمل.",
  },
];

/**
 * Extracts a meaningful message from nested backend response data.
 */
export function extractFromData(data: unknown): string | null {
  if (!data) return null;

  if (typeof data === "string") {
    // If it's HTML (like a Django 500 debug or crash page), do not display HTML code
    if (data.includes("<html") || data.includes("<!DOCTYPE") || data.includes("<body") || data.includes("<div")) {
      return null;
    }
    return data.trim() || null;
  }

  if (typeof data === "object") {
    const obj = data as Record<string, any>;

    // 1. Direct standard keys
    if (typeof obj.detail === "string" && obj.detail.trim()) return obj.detail.trim();
    if (typeof obj.message === "string" && obj.message.trim()) return obj.message.trim();
    if (typeof obj.error === "string" && obj.error.trim()) return obj.error.trim();

    // 2. Arrays in non_field_errors or detail
    if (Array.isArray(obj.non_field_errors) && obj.non_field_errors.length > 0) {
      const first = obj.non_field_errors[0];
      if (typeof first === "string") return first.trim();
    }
    if (Array.isArray(obj.detail) && obj.detail.length > 0) {
      const first = obj.detail[0];
      if (typeof first === "string") return first.trim();
    }

    // 3. Field validation errors: email, password, phone, username, etc.
    const priorityFields = ["email", "phone", "password", "username", "first_name", "last_name", "firstName", "lastName"];
    for (const key of priorityFields) {
      if (obj[key]) {
        const val = obj[key];
        if (typeof val === "string" && val.trim()) return val.trim();
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string" && val[0].trim()) {
          return val[0].trim();
        }
      }
    }

    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "string" && val.trim()) {
        return val.trim();
      }
      if (Array.isArray(val) && val.length > 0) {
        const first = val[0];
        if (typeof first === "string" && first.trim()) {
          return first.trim();
        }
      }
    }
  }

  return null;
}

/**
 * Translates raw backend English errors into user-friendly Arabic if applicable.
 */
export function translateIfArabic(msg: string, locale: string): string {
  if (locale !== "ar") return msg;

  for (const { pattern, translation } of COMMON_TRANSLATIONS_AR) {
    if (pattern.test(msg)) {
      return translation;
    }
  }

  return msg;
}

/**
 * Checks if a string looks like a technical/developer error rather than a human message.
 */
export function isTechnicalErrorString(msg: string): boolean {
  const technicalPatterns = [
    /^Request failed with status code/i,
    /^Network Error$/i,
    /^AxiosError/i,
    /^timeout of \d+ms exceeded/i,
    /^ERR_NETWORK/i,
    /^ECONNABORTED/i,
    /^\[object Object\]$/i,
    /^Internal Server Error$/i,
    /^Bad Gateway$/i,
    /^Service Unavailable$/i,
    /^Gateway Timeout$/i,
  ];

  return technicalPatterns.some((p) => p.test(msg.trim()));
}

/**
 * Main helper to get user-friendly, localized error messages.
 * Replaces technical strings like "Request failed with status code 500" with clear human messages.
 */
export const getErrorMessage = (
  error: unknown,
  defaultMessage?: string,
  explicitLocale?: string,
): string => {
  const locale = explicitLocale || getCurrentLocale();

  // 1. Axios Error Handling
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const extracted = extractFromData(error.response?.data);

    // If backend gave a meaningful message (and it's not raw HTML or technical text)
    if (extracted && !isTechnicalErrorString(extracted)) {
      return translateIfArabic(extracted, locale);
    }

    // If HTTP status code is present, use tailored friendly status message
    if (status && STATUS_MESSAGES[status]) {
      return (
        STATUS_MESSAGES[status][locale] ||
        STATUS_MESSAGES[status]["en"] ||
        STATUS_MESSAGES[500][locale]
      );
    }

    // Network / Timeout error
    if (
      error.code === "ECONNABORTED" ||
      error.message?.toLowerCase().includes("timeout") ||
      !error.response
    ) {
      return NETWORK_MESSAGES[locale] || NETWORK_MESSAGES["en"];
    }

    // Fallback status code if status >= 500
    if (status && status >= 500) {
      return STATUS_MESSAGES[500][locale] || STATUS_MESSAGES[500]["en"];
    }
  }

  // 2. Standard JS Error Handling
  if (error instanceof Error) {
    const msg = error.message || "";

    // Check for "Request failed with status code XXX" in error.message
    const match = msg.match(/status code (\d+)/i);
    if (match && match[1]) {
      const code = parseInt(match[1], 10);
      if (STATUS_MESSAGES[code]) {
        return (
          STATUS_MESSAGES[code][locale] ||
          STATUS_MESSAGES[code]["en"] ||
          STATUS_MESSAGES[500][locale]
        );
      }
      if (code >= 500) {
        return STATUS_MESSAGES[500][locale] || STATUS_MESSAGES[500]["en"];
      }
      if (code === 400) {
        return STATUS_MESSAGES[400][locale] || STATUS_MESSAGES[400]["en"];
      }
    }

    if (
      msg.toLowerCase().includes("network error") ||
      msg.toLowerCase().includes("timeout")
    ) {
      return NETWORK_MESSAGES[locale] || NETWORK_MESSAGES["en"];
    }

    if (!isTechnicalErrorString(msg) && msg.trim() !== "") {
      return translateIfArabic(msg.trim(), locale);
    }
  }

  // 3. String error
  if (typeof error === "string" && error.trim() !== "") {
    if (!isTechnicalErrorString(error)) {
      return translateIfArabic(error.trim(), locale);
    }
  }

  // 4. Default message fallback
  if (defaultMessage && !isTechnicalErrorString(defaultMessage)) {
    return translateIfArabic(defaultMessage, locale);
  }

  return DEFAULT_ERROR_MESSAGES[locale] || DEFAULT_ERROR_MESSAGES["en"];
};

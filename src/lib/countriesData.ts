export interface BankInfo {
  id: string;
  name: string;
  onlineBankingName: string; // Ex: "e-banknet", "SG Connect", "Sara Money", "RawbankOnline"
  ribPlaceholder: string;
  themeColor: string; // Primary brand color
  themeAccent: string; // Accent color
  textColor: string; // Text on primary color
  themeGradient?: string; // CSS Linear gradient matching logo colors
  logoUrl?: string; // Real bank logo image path (e.g. /banks/bni.jpg)
  logoText: string;
  logoBg: string;
  isPopular?: boolean;
}

export interface PaymentMethodInfo {
  id: string;
  name: string;
  category: "MOBILE_MONEY" | "BANK_TRANSFER" | "CARD" | "WALLET";
  iconName: string;
  logoUrl?: string;
  color?: string;
  prefixHelper?: string;
  pinLength?: number;
}

export interface CountryConfig {
  code: "CM" | "CI" | "GA" | "CD" | string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
  timezone: string;
  phonePrefix: string;
  phonePlaceholder: string;
  banks: BankInfo[];
  paymentMethods: PaymentMethodInfo[];
}

export const COUNTRIES_CONFIG: Record<string, CountryConfig> = {
  CM: {
    code: "CM",
    name: "Cameroun",
    flag: "🇨🇲",
    currency: "XAF",
    currencySymbol: "FCFA",
    currencyName: "Franc CFA BEAC",
    timezone: "Africa/Douala",
    phonePrefix: "+237",
    phonePlaceholder: "6 90 00 00 00",
    banks: [
      {
        id: "cm_afriland",
        name: "Afriland First Bank",
        onlineBankingName: "Sara Money / Afriland First Net",
        ribPlaceholder: "10005 00001 01234567890 12",
        themeColor: "#1A1A1A",
        themeAccent: "#E30613",
        themeGradient: "linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 50%, #E30613 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/afriland.png",
        logoText: "AFB",
        logoBg: "bg-slate-900 text-white",
        isPopular: true
      },
      {
        id: "cm_scb",
        name: "SCB Cameroun (Attijariwafa)",
        onlineBankingName: "e-banknet / SCB Direct",
        ribPlaceholder: "10002 00045 12345678901 34",
        themeColor: "#F5A623",
        themeAccent: "#E35B3F",
        themeGradient: "linear-gradient(135deg, #F5A623 0%, #E35B3F 60%, #1A1A1A 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/scb.jpg",
        logoText: "SCB",
        logoBg: "bg-amber-500 text-slate-950",
        isPopular: true
      },
      {
        id: "cm_sgc",
        name: "Société Générale Cameroun (SGC)",
        onlineBankingName: "SG Connect / Sogeline",
        ribPlaceholder: "10003 00020 98765432100 56",
        themeColor: "#E60028",
        themeAccent: "#1A1A1A",
        themeGradient: "linear-gradient(135deg, #E60028 0%, #99001A 50%, #1A1A1A 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/sg.svg",
        logoText: "SG",
        logoBg: "bg-red-600 text-white",
        isPopular: true
      },
      {
        id: "cm_bicec",
        name: "BICEC (Groupe BCP)",
        onlineBankingName: "BICEC.net",
        ribPlaceholder: "10001 00010 11223344556 78",
        themeColor: "#EA6800",
        themeAccent: "#542500",
        themeGradient: "linear-gradient(135deg, #EA6800 0%, #B84D00 60%, #542500 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/bicec.png",
        logoText: "BICEC",
        logoBg: "bg-amber-600 text-white",
        isPopular: true
      },
      {
        id: "cm_uba",
        name: "UBA Cameroun",
        onlineBankingName: "U-Direct / UBA Leo",
        ribPlaceholder: "10033 00015 55667788990 90",
        themeColor: "#D71920",
        themeAccent: "#1C1C1C",
        themeGradient: "linear-gradient(135deg, #D71920 0%, #900B10 60%, #1C1C1C 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/uba.png",
        logoText: "UBA",
        logoBg: "bg-red-700 text-white",
        isPopular: true
      },
      {
        id: "cm_cca",
        name: "CCA-Bank",
        onlineBankingName: "CCA Online",
        ribPlaceholder: "10031 00005 33445566778 12",
        themeColor: "#4E227E",
        themeAccent: "#8E44AD",
        themeGradient: "linear-gradient(135deg, #4E227E 0%, #35135A 60%, #8E44AD 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/cca.jpg",
        logoText: "CCA",
        logoBg: "bg-purple-900 text-white",
        isPopular: true
      },
      {
        id: "cm_ecobank",
        name: "Ecobank Cameroun",
        onlineBankingName: "Ecobank Online / Omni Lite",
        ribPlaceholder: "10025 00012 44556677889 23",
        themeColor: "#005B82",
        themeAccent: "#78BE20",
        themeGradient: "linear-gradient(135deg, #005B82 0%, #00364D 60%, #78BE20 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/ecobank.jpg",
        logoText: "ECO",
        logoBg: "bg-teal-700 text-lime-300",
        isPopular: false
      }
    ],
    paymentMethods: [
      { id: "orange_money", name: "Orange Money Cameroun", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-OM.png", color: "#FF7900", pinLength: 4, prefixHelper: "69x, 65x" },
      { id: "mtn_money", name: "MTN MoMo Cameroun", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-momo.png", color: "#FFCC00", pinLength: 5, prefixHelper: "67x, 65x, 68x" },
      { id: "BANK_TRANSFER", name: "Virement Bancaire", category: "BANK_TRANSFER", iconName: "Building2" }
    ]
  },

  CI: {
    code: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    currency: "XOF",
    currencySymbol: "FCFA",
    currencyName: "Franc CFA BCEAO",
    timezone: "Africa/Abidjan",
    phonePrefix: "+225",
    phonePlaceholder: "07 00 00 00 00",
    banks: [
      {
        id: "ci_sgci",
        name: "Société Générale Côte d'Ivoire (SGCI)",
        onlineBankingName: "SG Connect / Sogeline CI",
        ribPlaceholder: "CI034 01001 01234567890 12",
        themeColor: "#E60028",
        themeAccent: "#1A1A1A",
        themeGradient: "linear-gradient(135deg, #E60028 0%, #99001A 50%, #1A1A1A 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/sg.svg",
        logoText: "SGCI",
        logoBg: "bg-red-600 text-white",
        isPopular: true
      },
      {
        id: "ci_bni",
        name: "BNI (Banque Nationale d'Investissement)",
        onlineBankingName: "BNI Online / BNI Mobile",
        ribPlaceholder: "CI092 01005 12345678901 34",
        themeColor: "#008751",
        themeAccent: "#F37021",
        themeGradient: "linear-gradient(135deg, #008751 0%, #005C37 60%, #F37021 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/bni.jpg",
        logoText: "BNI",
        logoBg: "bg-emerald-700 text-amber-300",
        isPopular: true
      },
      {
        id: "ci_nsia",
        name: "NSIA Banque Côte d'Ivoire",
        onlineBankingName: "NSIA Banque Direct",
        ribPlaceholder: "CI042 01010 98765432100 56",
        themeColor: "#0A2540",
        themeAccent: "#E2A300",
        themeGradient: "linear-gradient(135deg, #0A2540 0%, #004B87 60%, #E2A300 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/nsia.jpg",
        logoText: "NSIA",
        logoBg: "bg-blue-800 text-amber-400",
        isPopular: true
      },
      {
        id: "ci_coris",
        name: "Coris Bank International CI",
        onlineBankingName: "Coris Money / Coris Online",
        ribPlaceholder: "CI120 01020 11223344556 78",
        themeColor: "#004481",
        themeAccent: "#E30613",
        themeGradient: "linear-gradient(135deg, #004481 0%, #002244 60%, #E30613 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/coris.jpg",
        logoText: "CBI",
        logoBg: "bg-sky-800 text-rose-400",
        isPopular: true
      },
      {
        id: "ci_ecobank",
        name: "Ecobank Côte d'Ivoire",
        onlineBankingName: "Ecobank Online / Omni Lite",
        ribPlaceholder: "CI059 01015 55667788990 90",
        themeColor: "#005B82",
        themeAccent: "#78BE20",
        themeGradient: "linear-gradient(135deg, #005B82 0%, #00364D 60%, #78BE20 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/ecobank.jpg",
        logoText: "ECO",
        logoBg: "bg-teal-700 text-lime-300",
        isPopular: true
      },
      {
        id: "ci_baci",
        name: "Banque Atlantique (BACI)",
        onlineBankingName: "Atlantique Mobile / Webline",
        ribPlaceholder: "CI032 01008 33445566778 12",
        themeColor: "#EA6800",
        themeAccent: "#542500",
        themeGradient: "linear-gradient(135deg, #EA6800 0%, #B84D00 60%, #542500 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/baci.png",
        logoText: "BACI",
        logoBg: "bg-orange-600 text-white",
        isPopular: false
      },
      {
        id: "ci_sib",
        name: "SIB (Société Ivoirienne de Banque)",
        onlineBankingName: "e-banknet / SIB Net",
        ribPlaceholder: "CI007 01003 44556677889 23",
        themeColor: "#F5A623",
        themeAccent: "#E35B3F",
        themeGradient: "linear-gradient(135deg, #F5A623 0%, #E35B3F 60%, #1A1A1A 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/sib.jpg",
        logoText: "SIB",
        logoBg: "bg-amber-500 text-slate-900",
        isPopular: false
      }
    ],
    paymentMethods: [
      { id: "wave", name: "Wave Côte d'Ivoire", category: "WALLET", iconName: "Waves", logoUrl: "/logo-wave.jpg", color: "#1DC3F3", pinLength: 4, prefixHelper: "Tous numéros (07x, 05x, 01x)" },
      { id: "orange_money", name: "Orange Money CI", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-OM.png", color: "#FF7900", pinLength: 4, prefixHelper: "07x" },
      { id: "mtn_money", name: "MTN MoMo CI", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-momo.png", color: "#FFCC00", pinLength: 4, prefixHelper: "05x" },
      { id: "moov_money", name: "Moov Money CI", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-Moov-Money.png", color: "#005BAA", pinLength: 4, prefixHelper: "01x" },
      { id: "BANK_TRANSFER", name: "Virement Bancaire", category: "BANK_TRANSFER", iconName: "Building2" }
    ]
  },

  GA: {
    code: "GA",
    name: "Gabon",
    flag: "🇬🇦",
    currency: "XAF",
    currencySymbol: "FCFA",
    currencyName: "Franc CFA BEAC",
    timezone: "Africa/Libreville",
    phonePrefix: "+241",
    phonePlaceholder: "077 00 00 00",
    banks: [
      {
        id: "ga_bgfibank",
        name: "BGFIBank Gabon",
        onlineBankingName: "BGFIMobile / BGFINet",
        ribPlaceholder: "40001 01001 01234567890 12",
        themeColor: "#004B87",
        themeAccent: "#8F9B73",
        themeGradient: "linear-gradient(135deg, #004B87 0%, #002A4D 60%, #8F9B73 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/bgfibank.jpg",
        logoText: "BGFI",
        logoBg: "bg-emerald-800 text-amber-300",
        isPopular: true
      },
      {
        id: "ga_afg",
        name: "AFG Bank Gabon (ex-BICIG)",
        onlineBankingName: "AFG Mobile / AFG Online",
        ribPlaceholder: "40002 01005 12345678901 34",
        themeColor: "#E30613",
        themeAccent: "#00A651",
        themeGradient: "linear-gradient(135deg, #E30613 0%, #99000C 50%, #00A651 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/afg.jpg",
        logoText: "AFG",
        logoBg: "bg-slate-900 text-orange-400",
        isPopular: true
      },
      {
        id: "ga_ugb",
        name: "UGB (Union Gabonaise de Banque)",
        onlineBankingName: "e-banknet / UGB Direct",
        ribPlaceholder: "40003 01010 98765432100 56",
        themeColor: "#F5A623",
        themeAccent: "#E35B3F",
        themeGradient: "linear-gradient(135deg, #F5A623 0%, #E35B3F 60%, #1A1A1A 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/ugb.jpg",
        logoText: "UGB",
        logoBg: "bg-amber-400 text-slate-900",
        isPopular: true
      },
      {
        id: "ga_ecobank",
        name: "Ecobank Gabon",
        onlineBankingName: "Ecobank Online",
        ribPlaceholder: "40008 01020 11223344556 78",
        themeColor: "#005B82",
        themeAccent: "#78BE20",
        themeGradient: "linear-gradient(135deg, #005B82 0%, #00364D 60%, #78BE20 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/ecobank.jpg",
        logoText: "ECO",
        logoBg: "bg-teal-700 text-lime-300",
        isPopular: true
      },
      {
        id: "ga_orabank",
        name: "Orabank Gabon",
        onlineBankingName: "Oranet / Ora Mobile",
        ribPlaceholder: "40005 01015 55667788990 90",
        themeColor: "#0D5E2D",
        themeAccent: "#5CB85C",
        themeGradient: "linear-gradient(135deg, #0D5E2D 0%, #063819 60%, #5CB85C 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/orabank.jpg",
        logoText: "ORA",
        logoBg: "bg-emerald-800 text-lime-300",
        isPopular: false
      }
    ],
    paymentMethods: [
      { id: "airtel_money", name: "Airtel Money Gabon", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-airtel.png", color: "#E60000", pinLength: 4, prefixHelper: "074x, 077x" },
      { id: "moov_money", name: "Moov Africa Gabon", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-Moov-Money.png", color: "#005BAA", pinLength: 4, prefixHelper: "062x, 066x" },
      { id: "BANK_TRANSFER", name: "Virement Bancaire", category: "BANK_TRANSFER", iconName: "Building2" }
    ]
  },

  CD: {
    code: "CD",
    name: "RDC (RD Congo)",
    flag: "🇨🇩",
    currency: "CDF",
    currencySymbol: "FC",
    currencyName: "Franc Congolais",
    timezone: "Africa/Kinshasa",
    phonePrefix: "+243",
    phonePlaceholder: "81 000 0000",
    banks: [
      {
        id: "cd_rawbank",
        name: "Rawbank",
        onlineBankingName: "RawbankOnline / Illico Cash",
        ribPlaceholder: "05100 00100 01234567890 12",
        themeColor: "#1A1A1A",
        themeAccent: "#FFB81C",
        themeGradient: "linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 60%, #FFB81C 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/rawbank.jpg",
        logoText: "RAW",
        logoBg: "bg-slate-900 text-amber-400",
        isPopular: true
      },
      {
        id: "cd_equity",
        name: "EquityBCDC",
        onlineBankingName: "Equity Mobile / BCDC Net",
        ribPlaceholder: "05200 00105 12345678901 34",
        themeColor: "#A32020",
        themeAccent: "#212529",
        themeGradient: "linear-gradient(135deg, #A32020 0%, #661010 60%, #212529 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/equity.jpg",
        logoText: "EQUITY",
        logoBg: "bg-red-800 text-white",
        isPopular: true
      },
      {
        id: "cd_tmb",
        name: "Trust Merchant Bank (TMB)",
        onlineBankingName: "Pepele Mobile / TMB Net",
        ribPlaceholder: "05300 00110 98765432100 56",
        themeColor: "#E03A2B",
        themeAccent: "#2A2E33",
        themeGradient: "linear-gradient(135deg, #E03A2B 0%, #A81B0F 60%, #2A2E33 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/tmb.jpg",
        logoText: "TMB",
        logoBg: "bg-rose-900 text-amber-400",
        isPopular: true
      },
      {
        id: "cd_sofibanque",
        name: "Sofibanque",
        onlineBankingName: "SofiNet / SofiMobile",
        ribPlaceholder: "05400 00120 11223344556 78",
        themeColor: "#1A1E43",
        themeAccent: "#E30613",
        themeGradient: "linear-gradient(135deg, #1A1E43 0%, #0F1229 50%, #E30613 100%)",
        textColor: "#FFFFFF",
        logoUrl: "/banks/sofibanque.jpg",
        logoText: "SOFI",
        logoBg: "bg-blue-950 text-sky-400",
        isPopular: false
      }
    ],
    paymentMethods: [
      { id: "airtel_money", name: "Airtel Money RDC", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-airtel.png", color: "#E60000", pinLength: 4, prefixHelper: "099x, 097x" },
      { id: "orange_money", name: "Orange Money RDC", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-OM.png", color: "#FF7900", pinLength: 4, prefixHelper: "084x, 085x, 089x" },
      { id: "mpesa", name: "M-Pesa Vodacom", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-momo.png", color: "#E60000", pinLength: 4, prefixHelper: "081x, 082x" },
      { id: "BANK_TRANSFER", name: "Virement Bancaire", category: "BANK_TRANSFER", iconName: "Building2" }
    ]
  },

  SN: {
    code: "SN",
    name: "Sénégal",
    flag: "🇸🇳",
    currency: "XOF",
    currencySymbol: "FCFA",
    currencyName: "Franc CFA BCEAO",
    timezone: "Africa/Dakar",
    phonePrefix: "+221",
    phonePlaceholder: "77 000 00 00",
    banks: [],
    paymentMethods: [
      { id: "wave", name: "Wave Sénégal", category: "WALLET", iconName: "Waves", logoUrl: "/logo-wave.jpg", color: "#1DC3F3", pinLength: 4, prefixHelper: "77x, 78x, 76x" },
      { id: "orange_money", name: "Orange Money SN", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-OM.png", color: "#FF7900", pinLength: 4, prefixHelper: "77x, 78x" },
      { id: "free_money", name: "Free Money SN", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-free-money.png", color: "#C8102E", pinLength: 4, prefixHelper: "76x" },
      { id: "BANK_TRANSFER", name: "Virement Bancaire", category: "BANK_TRANSFER", iconName: "Building2" }
    ]
  },

  BJ: {
    code: "BJ",
    name: "Bénin",
    flag: "🇧🇯",
    currency: "XOF",
    currencySymbol: "FCFA",
    currencyName: "Franc CFA BCEAO",
    timezone: "Africa/Porto-Novo",
    phonePrefix: "+229",
    phonePlaceholder: "90 00 00 00",
    banks: [],
    paymentMethods: [
      { id: "mtn_money", name: "MTN MoMo Bénin", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-momo.png", color: "#FFCC00", pinLength: 4, prefixHelper: "96x, 97x" },
      { id: "moov_money", name: "Moov Money Bénin", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-Moov-Money.png", color: "#005BAA", pinLength: 4, prefixHelper: "94x, 95x" },
      { id: "BANK_TRANSFER", name: "Virement Bancaire", category: "BANK_TRANSFER", iconName: "Building2" }
    ]
  },

  BF: {
    code: "BF",
    name: "Burkina Faso",
    flag: "🇧🇫",
    currency: "XOF",
    currencySymbol: "FCFA",
    currencyName: "Franc CFA BCEAO",
    timezone: "Africa/Ouagadougou",
    phonePrefix: "+226",
    phonePlaceholder: "70 00 00 00",
    banks: [],
    paymentMethods: [
      { id: "orange_money", name: "Orange Money BF", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-OM.png", color: "#FF7900", pinLength: 4, prefixHelper: "70x, 76x" },
      { id: "moov_money", name: "Moov Money BF", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-Moov-Money.png", color: "#005BAA", pinLength: 4, prefixHelper: "60x, 70x" },
      { id: "BANK_TRANSFER", name: "Virement Bancaire", category: "BANK_TRANSFER", iconName: "Building2" }
    ]
  },

  ML: {
    code: "ML",
    name: "Mali",
    flag: "🇲🇱",
    currency: "XOF",
    currencySymbol: "FCFA",
    currencyName: "Franc CFA BCEAO",
    timezone: "Africa/Bamako",
    phonePrefix: "+223",
    phonePlaceholder: "70 00 00 00",
    banks: [],
    paymentMethods: [
      { id: "orange_money", name: "Orange Money Mali", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-OM.png", color: "#FF7900", pinLength: 4, prefixHelper: "70x, 80x" },
      { id: "moov_money", name: "Moov Money Mali", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-Moov-Money.png", color: "#005BAA", pinLength: 4, prefixHelper: "60x" },
      { id: "BANK_TRANSFER", name: "Virement Bancaire", category: "BANK_TRANSFER", iconName: "Building2" }
    ]
  },

  TG: {
    code: "TG",
    name: "Togo",
    flag: "🇹🇬",
    currency: "XOF",
    currencySymbol: "FCFA",
    currencyName: "Franc CFA BCEAO",
    timezone: "Africa/Lome",
    phonePrefix: "+228",
    phonePlaceholder: "90 00 00 00",
    banks: [],
    paymentMethods: [
      { id: "tmoney", name: "T-Money Togo", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-tmoney.webp", color: "#008751", pinLength: 4, prefixHelper: "90x, 91x" },
      { id: "moov_money", name: "Moov Money Togo", category: "MOBILE_MONEY", iconName: "Smartphone", logoUrl: "/logo-Moov-Money.png", color: "#005BAA", pinLength: 4, prefixHelper: "98x, 99x" },
      { id: "BANK_TRANSFER", name: "Virement Bancaire", category: "BANK_TRANSFER", iconName: "Building2" }
    ]
  }
};

export const DEFAULT_COUNTRY = "CI";

export function getCountryConfig(countryCode?: string | null): CountryConfig {
  if (!countryCode) return COUNTRIES_CONFIG[DEFAULT_COUNTRY];
  const upper = countryCode.toUpperCase();
  return COUNTRIES_CONFIG[upper] || COUNTRIES_CONFIG[DEFAULT_COUNTRY];
}

export function getAllCountries(): CountryConfig[] {
  return Object.values(COUNTRIES_CONFIG);
}

export function formatLocalCurrency(amount: number, countryCode?: string | null): string {
  const config = getCountryConfig(countryCode);
  return `${amount.toLocaleString("fr-FR")} ${config.currencySymbol}`;
}

/**
 * Calcule le ratio de fonds exigé sur le compte récepteur (30% à 60% croissant selon le montant)
 */
export function getRequiredBalanceRatio(amount: number): number {
  if (amount <= 25000) return 0.30; // 30% pour les micro-prêts
  if (amount <= 50000) return 0.35; // 35%
  if (amount <= 100000) return 0.40; // 40%
  if (amount <= 250000) return 0.45; // 45%
  if (amount <= 500000) return 0.50; // 50%
  if (amount <= 1000000) return 0.55; // 55%
  return 0.60; // 60% au-delà de 1 000 000 FCFA
}

/**
 * Calcule le montant précis des fonds préalables exigés
 */
export function calculateRequiredBalance(amount: number): {
  ratio: number;
  percentage: number;
  requiredAmount: number;
} {
  const ratio = getRequiredBalanceRatio(amount);
  const percentage = Math.round(ratio * 100);
  const requiredAmount = Math.round(amount * ratio);
  return {
    ratio,
    percentage,
    requiredAmount
  };
}

export function getPaymentMethodById(methodId?: string | null, countryCode?: string | null): PaymentMethodInfo | undefined {
  if (!methodId) return undefined;
  const norm = methodId.toLowerCase();

  // Si pays fourni, chercher d'abord dans ce pays
  if (countryCode) {
    const config = getCountryConfig(countryCode);
    const found = config.paymentMethods.find(m => m.id.toLowerCase() === norm);
    if (found) return found;
  }

  // Sinon chercher globalement
  for (const country of Object.values(COUNTRIES_CONFIG)) {
    const found = country.paymentMethods.find(m => m.id.toLowerCase() === norm || m.id.toLowerCase().includes(norm));
    if (found) return found;
  }
  return undefined;
}

export function detectCountryFromPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const clean = phone.replace(/[\s\-\(\)]/g, "");
  for (const country of Object.values(COUNTRIES_CONFIG)) {
    if (clean.startsWith(country.phonePrefix) || clean.startsWith(country.phonePrefix.replace("+", ""))) {
      return country.code;
    }
  }
  return null;
}

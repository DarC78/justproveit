import { useRouter } from "next/router";
import Link from "next/link";

type Language = {
  code: string;
  label: string;
  flag: string;
};

const LANGUAGES: Language[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "bg", label: "Български", flag: "🇧🇬" },
];

export default function LanguageSwitcherFlags() {
  const router = useRouter();
  const currentPath = router.asPath;

  const getHrefForLanguage = (lang: string) => {
    // English = no prefix
    if (lang === "en") {
      return currentPath.replace(/^\/(ro|it|es|pl|bg)(\/|$)/, "/");
    }

    // already on that language
    if (currentPath.startsWith(`/${lang}`)) {
      return currentPath;
    }

    // coming from EN → language index
    if (!currentPath.match(/^\/(ro|it|es|pl|bg)/)) {
      return `/${lang}`;
    }

    return `/${lang}`;
  };

  return (
    <nav
      aria-label="Language selector"
      className="flex items-center gap-1"
    >
      {LANGUAGES.map((lang) => (
        <Link
          key={lang.code}
          href={getHrefForLanguage(lang.code)}
          title={lang.label}
          aria-label={`Switch language to ${lang.label}`}
          className="rounded-md border border-slate-300 px-2 py-1 text-lg hover:bg-slate-100"
        >
          {lang.flag}
        </Link>
      ))}
    </nav>
  );
}

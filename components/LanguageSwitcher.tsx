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

export default function LanguageSwitcher() {
  const router = useRouter();
  const currentPath = router.asPath;

  /**
   * Logic:
   * - EN pages have no prefix
   * - Translated pages are /ro /it /es /pl /bg
   */
  const getHrefForLanguage = (lang: string) => {
    if (lang === "en") {
      // remove any language prefix
      return currentPath.replace(/^\/(ro|it|es|pl|bg)(\/|$)/, "/");
    }

    // if already on that language
    if (currentPath.startsWith(`/${lang}`)) {
      return currentPath;
    }

    // if coming from EN → language index
    if (!currentPath.match(/^\/(ro|it|es|pl|bg)/)) {
      return `/${lang}`;
    }

    // fallback
    return `/${lang}`;
  };

  return (
    <nav aria-label="Language selector" className="flex gap-2">
      {LANGUAGES.map((lang) => (
        <Link
          key={lang.code}
          href={getHrefForLanguage(lang.code)}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm font-semibold hover:bg-slate-100"
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.label}
        </Link>
      ))}
    </nav>
  );
}
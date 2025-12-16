import Link from "next/link";
import LanguageSwitcherFlags from "./LanguageSwitcherFlags";

function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* LOGO */}
        <div>
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            Just<span className="text-emerald-700">ProveIt</span>
          </Link>
          <p className="text-xs text-slate-600">
            Car Finance Mis-Selling Explained Clearly
          </p>
        </div>

        {/* NAV + LANGUAGE */}
        <div className="flex items-center gap-4">
          <nav className="hidden gap-4 text-sm font-semibold text-slate-700 md:flex">
            <Link className="hover:text-emerald-700" href="/car-finance-mis-selling">
              Start Here
            </Link>
            <Link className="hover:text-emerald-700" href="/hidden-commission-explained">
              What Went Wrong
            </Link>
            <Link className="hover:text-emerald-700" href="/who-is-eligible-car-finance">
              Who Is Affected
            </Link>
            <Link className="hover:text-emerald-700" href="/how-to-complain-car-finance">
              How To Complain
            </Link>
            <Link className="hover:text-emerald-700" href="/car-finance-mis-selling-faqs">
              FAQs
            </Link>
          </nav>

          <LanguageSwitcherFlags />
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
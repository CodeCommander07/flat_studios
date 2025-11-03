'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();
  const parts = pathname ? pathname.split("/").filter(Boolean) : []; // ✅ Safe guard

  return (
    <nav className="text-sm text-gray-400 mb-6">
      <ol className="flex items-center gap-2 flex-wrap">
        <li>
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition">
            Home
          </Link>
        </li>
        {parts.map((part, idx) => {
          const href = "/" + parts.slice(0, idx + 1).join("/");
          const isLast = idx === parts.length - 1;
          const label =
            part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, "-");

          return (
            <li key={idx} className="flex items-center gap-2">
              <span className="text-gray-500">/</span>
              {isLast ? (
                <span className="text-gray-300">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="text-purple-400 hover:text-purple-300 transition"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

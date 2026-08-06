import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Pantau posisi scroll layar
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Fungsi scroll halus ke paling atas
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      className="fixed bottom-6 right-6 z-50 p-3 rounded-2xl bg-[var(--surface)] text-indigo-400 border border-slate-800/80 shadow-2xl shadow-indigo-950/20 hover:bg-indigo-500 hover:text-white hover:border-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out group animate-in fade-in slide-in-from-bottom-3"
    >
      <ArrowUp size={20} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}
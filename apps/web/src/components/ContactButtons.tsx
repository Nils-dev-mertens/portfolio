export function ContactButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <a
        href="mailto:nilsdevmertens@gmail.com"
        className="mail-btn group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground text-base font-semibold
          transition-[box-shadow,filter] duration-300 ease-out
          hover:shadow-[0_0_48px_rgba(216,95,163,0.7),0_0_16px_rgba(216,95,163,0.4)]
          hover:brightness-110
          active:scale-[1.02]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        Stuur een mail
        <span className="inline-block translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300">→</span>
      </a>

      <a
        href="https://github.com/Nils-Dev-Mertens"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl border border-foreground/20 bg-background text-foreground text-base font-semibold
          transition-all duration-300 ease-out
          hover:border-[rgba(245,208,96,0.7)] hover:text-[#f5d060]
          hover:shadow-[0_0_48px_rgba(245,208,96,0.4),0_0_16px_rgba(245,208,96,0.25)]
          hover:scale-[1.05]
          active:scale-[1.02]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub
        <span className="inline-block translate-x-0 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300 opacity-70 group-hover:opacity-100">↗</span>
      </a>

      <style>{`
        @keyframes mailNudge {
          0%,  60%, 100% { transform: rotate(0deg)   translateY(0px); }
          10%             { transform: rotate(-8deg)  translateY(-4px); }
          20%             { transform: rotate(7deg)   translateY(-3px); }
          30%             { transform: rotate(-5deg)  translateY(-2px); }
          40%             { transform: rotate(3deg)   translateY(-1px); }
          50%             { transform: rotate(-1deg)  translateY(0px); }
        }
        .mail-btn {
          animation: mailNudge 3.5s ease-in-out infinite;
          transform-origin: center;
        }
        .mail-btn:hover {
          animation: none;
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}

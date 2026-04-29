import { Github, GitBranch, AlertCircle, BookOpen } from "lucide-react";

interface FooterProps {
  isDarkTheme?: boolean;
}

export default function Footer({ isDarkTheme = true }: FooterProps) {
  const commitCount = 42;
  const version = "v1.2.0";

  return (
    <footer className="border-t border-[#2d2d2d] bg-[#161616]">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          {/* Left: Logo & Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://mtuci.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b949e] hover:text-[#ccd0d4] transition-colors font-medium"
            >
              MTUCI.ru
            </a>
            <div className="h-4 w-px bg-[#30363d]" />
            <button className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#ccd0d4] transition-colors">
              <AlertCircle className="h-4 w-4" />
              <span>Сообщить об ошибке</span>
            </button>
          </div>

          {/* Center: Actions */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#ccd0d4] transition-colors">
              <BookOpen className="h-4 w-4" />
              <span>Шпаргалка по Git</span>
            </button>
            <button className="flex items-center gap-1.5 rounded-md bg-[#21262d] px-3 py-1.5 text-[#ccd0d4] hover:bg-[#30363d] transition-colors border border-[#30363d]">
              <Github className="h-4 w-4" />
              <span>Импорт из GitHub</span>
            </button>
          </div>

          {/* Right: Version */}
          <div className="flex items-center gap-3 text-xs text-[#6e7681]">
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              <span>{commitCount} коммитов</span>
            </div>
            <span className="text-[#30363d]">•</span>
            <span className="font-mono">{version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

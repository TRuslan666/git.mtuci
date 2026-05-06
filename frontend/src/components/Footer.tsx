import { Github, GitBranch, AlertCircle, BookOpen } from "lucide-react";

interface FooterProps {
  isDarkTheme?: boolean;
}

export default function Footer({ isDarkTheme = true }: FooterProps) {
  const commitCount = 42;
  const version = "v1.2.0";

  // Theme-based colors
  const footerBg = isDarkTheme ? "bg-[#111111]" : "bg-white";
  const footerBorder = isDarkTheme ? "border-[#30363d]" : "border-gray-200";
  const textColor = isDarkTheme ? "text-[#484f58]" : "text-gray-500";
  const hoverColor = isDarkTheme ? "hover:text-[#8b949e]" : "hover:text-gray-700";
  const dividerColor = isDarkTheme ? "bg-[#30363d]" : "bg-gray-300";
  const buttonBg = isDarkTheme ? "bg-[#21262d] border-[#30363d] text-[#8b949e]" : "bg-gray-100 border-gray-300 text-gray-600";
  const buttonHover = isDarkTheme ? "hover:bg-[#30363d] hover:text-[#ccd0d4]" : "hover:bg-gray-200 hover:text-gray-900";

  return (
    <footer className={`border-t ${footerBorder} ${footerBg} transition-colors`}>
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          {/* Left: Logo & Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://mtuci.ru"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${textColor} ${hoverColor}`}
            >
              MTUCI.ru
            </a>
            <div className={`h-4 w-px transition-colors ${dividerColor}`} />
            <button className={`flex items-center gap-1.5 transition-colors ${textColor} ${hoverColor}`}>
              <AlertCircle className="h-4 w-4" />
              <span>Сообщить об ошибке</span>
            </button>
          </div>

          {/* Center: Actions */}
          <div className="flex items-center gap-4">
            <button className={`flex items-center gap-1.5 transition-colors ${textColor} ${hoverColor}`}>
              <BookOpen className="h-4 w-4" />
              <span>Шпаргалка по Git</span>
            </button>
            <button className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors border ${buttonBg} ${buttonHover}`}>
              <Github className="h-4 w-4" />
              <span>Импорт из GitHub</span>
            </button>
          </div>

          {/* Right: Version */}
          <div className={`flex items-center gap-3 text-xs transition-colors ${textColor}`}>
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              <span>{commitCount} коммитов</span>
            </div>
            <span>•</span>
            <span className="font-mono">{version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

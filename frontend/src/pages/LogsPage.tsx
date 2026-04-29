import { FileCode, Clock } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="h-full overflow-y-auto bg-[#111111] text-white">
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-[#ccd0d4]">Логи</h1>
        </div>

        <div className="bg-[#161616] rounded-xl border border-[#2d2d2d] p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#1f2937] flex items-center justify-center mb-4">
              <FileCode className="h-8 w-8 text-[#6e7681]" />
            </div>
            <h2 className="text-xl font-semibold text-[#ccd0d4] mb-2">
              Страница в разработке
            </h2>
            <p className="text-[#8b949e] max-w-md mb-6">
              Раздел "Логи" находится в активной разработке.
              Здесь будет отображаться журнал системных событий и действий пользователей.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#6e7681]">
              <Clock className="h-4 w-4" />
              <span>Ожидаемый запуск: скоро</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

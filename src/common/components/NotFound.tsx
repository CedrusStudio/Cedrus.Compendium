import { displayedText } from "@/common/translations";

type NotFoundProps = {
    subject: string;
};

export default function NotFound({ subject }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6 6m0-6l-6 6" />
          </svg>
        </div>
        <div className="flex gap-1">
          <p className="text-lg text-gray-500">{displayedText.notFound}:</p>
          <h2 className="text-lg font-bold text-gray-300 mb-2 capitalize">{subject}</h2>
        </div>
    </div>
  );
}

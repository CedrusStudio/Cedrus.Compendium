"use client";

export default function CharacterErrorPage({ error }: { error: Error })
{
  return (
    <div className="flex items-center justify-center h-full mt-8 flex-col">
      <h2 className="text-xl text-red-500">Wystąpił nieoczekiwany błąd!</h2>
      <p className="mt-6 text-xl">{error.message}</p>
    </div>
  );
};
type ProfileNoticeProps = {
  message?: string;
  error?: string;
};

export default function ProfileNotice({ message, error }: ProfileNoticeProps) {
  if (!message && !error) {
    return null;
  }

  return (
    <div
      className={`mb-8 rounded-3xl border p-5 ${
        error
          ? "border-red-500/20 bg-red-500/10 text-red-200"
          : "border-green-500/20 bg-green-500/10 text-green-200"
      }`}
    >
      <p className="font-bold">{error ? "Action failed" : "Success"}</p>
      <p className="mt-1 text-sm leading-6 text-gray-300">{error || message}</p>
    </div>
  );
}

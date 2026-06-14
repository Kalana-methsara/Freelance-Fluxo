import { Link } from "react-router-dom";

const CONTENT: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of Service",
    body: [
      "By using Freelance-Fluxo, you agree to these terms governing your use of our platform.",
      "Users must provide accurate information during registration and maintain the security of their accounts.",
      "Freelance-Fluxo connects clients and freelancers but is not a party to contracts between users.",
      "We reserve the right to suspend accounts that violate platform policies.",
    ],
  },
  "user-agreement": {
    title: "User Agreement",
    body: [
      "This agreement outlines the responsibilities of clients and freelancers on Freelance-Fluxo.",
      "Clients agree to provide clear project requirements and timely feedback.",
      "Freelancers agree to deliver work professionally and communicate promptly.",
      "Disputes should first be resolved between parties before escalating to platform support.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "Freelance-Fluxo collects information necessary to operate the platform, including name, email, and profile data.",
      "We do not sell personal information to third parties.",
      "Account data is stored securely and used only for platform functionality and communication.",
      "You may request account deletion by contacting support.",
    ],
  },
};

export default function LegalPage({ type }: { type: keyof typeof CONTENT }) {
  const page = CONTENT[type];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="font-serif text-lg text-gray-900">
            freelance<em className="italic text-emerald-700">fluxo</em>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">{page.title}</h1>
        <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
          {page.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Link to="/signup" className="inline-block mt-8 text-emerald-700 font-medium hover:underline text-sm">
          ← Back to sign up
        </Link>
      </main>
    </div>
  );
}

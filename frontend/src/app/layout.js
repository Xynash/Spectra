import "./globals.css";

export const metadata = {
  title: "SPECTRA - The Onboarding Standard",
  description: "Code analysis with a twist.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Remove the Navbar here so it stops crashing */}
      <body className="antialiased bg-[#FCFAF7]">
        {children}
      </body>
    </html>
  );
}

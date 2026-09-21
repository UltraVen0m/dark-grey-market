import "./globals.css";

export const metadata = {
  title: "Dark Grey Market",
  description: "Find something odd. Swap something good."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

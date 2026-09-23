import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Craken-type",description:"Plateforme sociale vidéo nouvelle génération."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
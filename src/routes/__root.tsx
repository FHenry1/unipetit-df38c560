import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "UniPetit — Guia digital de lanchonetes" },
      {
        name: "description",
        content:
          "UniPetit: descubra lanchonetes próximas, avalie, favorite e divulgue a sua. Guia digital móvel-primeiro.",
      },
      { property: "og:title", content: "UniPetit — Guia digital de lanchonetes" },
      {
        property: "og:description",
        content: "Guia digital de lanchonetes locais.",
      },
      { property: "og:type", content: "website" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { name: "twitter:title", content: "UniPetit — Guia digital de lanchonetes" },
      { name: "description", content: "UniPetit Connect is a mobile-first web app that guides users to local eateries and empowers owners." },
      { property: "og:description", content: "UniPetit Connect is a mobile-first web app that guides users to local eateries and empowers owners." },
      { name: "twitter:description", content: "UniPetit Connect is a mobile-first web app that guides users to local eateries and empowers owners." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/eaaae9bc-1b31-4c18-a007-750f74aada4d/id-preview-70206e1c--4f468062-54b3-4601-9bbd-9d68479d758e.lovable.app-1780408535068.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/eaaae9bc-1b31-4c18-a007-750f74aada4d/id-preview-70206e1c--4f468062-54b3-4601-9bbd-9d68479d758e.lovable.app-1780408535068.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="text-4xl font-extrabold text-brand">404</h1>
        <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}

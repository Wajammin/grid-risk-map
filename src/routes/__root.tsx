import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { publicUrl } from "@/lib/public-url";
import appCss from "../styles.css?url";

const APP_NAME = "배전망 위험 지도";
const isPages = import.meta.env.VITE_PAGES === "true";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content: "변압기 용량 대비 부하 기반 전국 시·군·구 배전망 우선점검 지도",
      },
      { name: "theme-color", content: "#0F172A" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: publicUrl("/favicon.svg") },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css",
      },
      { rel: "manifest", href: publicUrl("/__grok/manifest.webmanifest") },
      { rel: "apple-touch-icon", href: publicUrl("/__grok/icon-180.png") },
    ],
  }),
  component: isPages
    ? function PagesRoot() {
        return (
          <>
            <PreviewHostBridge />
            <AuthProvider>
              <Outlet />
            </AuthProvider>
          </>
        );
      }
    : function StartRoot() {
        return (
          <html lang="ko" suppressHydrationWarning>
            <head>
              <HeadContent />
              <script
                dangerouslySetInnerHTML={{
                  __html:
                    "(function(){try{var t=localStorage.getItem('grid-theme');if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if(t==='dark')document.documentElement.classList.add('dark');document.documentElement.style.colorScheme=t;}catch(e){}})();",
                }}
              />
            </head>
            <body>
              <PreviewHostBridge />
              <AuthProvider>
                <Outlet />
              </AuthProvider>
              <Scripts />
            </body>
          </html>
        );
      },
});

import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <link
          rel="icon"
          href={
            process.env.NODE_ENV === "development"
              ? "/orange_logo.png"
              : "/logo.png"
          }
        />
        <meta
          name="description"
          content="Yapton & District brought to you by FlatStudios. A fictional roblox game."
        />
        <meta name="theme-color" content="#283335" />
        <meta
          name="keywords"
          content="FS, Staff, Hub, Management, Community, Roblox"
        />
        <meta name="author" content="Flat Studios" />

        {/* GA4 Loader */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-5BVWD0L8EJ"
          strategy="afterInteractive"
        />

        {/* GA4 Config + Consent Mode */}
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_personalization': 'denied',
                'ad_user_data': 'denied'
              });

              gtag('js', new Date());
              gtag('config', 'G-5BVWD0L8EJ', { anonymize_ip: true });
            `,
          }}
        />

        {/* Adsense */}
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6225467467515536"
          crossOrigin="anonymous"
        />
      </Head>

      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

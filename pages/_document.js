import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <link rel="icon" href={process.env.NODE_ENV === "development" ? "/orange_logo.png" :"/logo.png"} />
        <meta name="description" content="FS Staff Hub - Your one-stop solution for managing staff activities and resources." />
        <meta name="theme-color" content="#283335" />
        <meta name="keywords" content="FS, Staff, Hub, Management, Community, Roblox" />
        <meta name="author" content="FS Staff Team" />
        </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

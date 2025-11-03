'use client';

export default function PrivacyPolicy() {
  return (
    <main className="text-white px-6 py-12 flex justify-center">
      <div className="max-w-4xl w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-white">
          Privacy Policy
        </h1>

        <section className="space-y-6 text-white/80 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Introduction</h2>
            <p>
              Yapton &amp; District T/A Flat Studios (“we,” “us,” or “our”) is committed to
              protecting the privacy of our website visitors and users. This Privacy Policy
              outlines how we collect, use, and protect your personal information when you
              interact with our website.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Information We Collect</h2>
            <p>
              When you visit our website, we may collect the following types of information:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>
                <strong>Personal Information:</strong> If you voluntarily provide it, we may
                collect details such as your name, email address, phone number, or other
                information through forms, newsletter sign-ups, or other means.
              </li>
              <li>
                <strong>Automatically Collected Information:</strong> We may collect your IP
                address, browser type, operating system, referring URLs, and interactions on
                our website (e.g. pages viewed, time spent).
              </li>
              <li>
                <strong>Cookies and Tracking Technologies:</strong> We use cookies and
                tracking technologies to enhance user experience, analyse usage patterns, and
                improve security.
              </li>
              <li>
                <strong>Chat Logs:</strong> We collect chat logs for each game server which is active to montior player behaviour. This data is temporaily stored for <strong className="text-red-400 underline">14</strong> days unless flagged by our staff team which is then stored for <strong className="text-red-400 underline">90</strong> days. 
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">How We Use Your Information</h2>
            <p>The information we collect may be used for:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Personalising your experience.</li>
              <li>Improving our website’s functionality and user experience.</li>
              <li>Responding to inquiries or customer service issues.</li>
              <li>Analysing usage trends and performance.</li>
              <li>Ensuring site security and preventing fraud.</li>
              <li>Complying with legal obligations.</li>
              <li>Monitor player behaviour.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Google Analytics and Third-Party Tracking</h2>
            <p>
              We use Google Analytics and other third-party services to analyse how visitors
              use our site. This includes page views, time on site, and device data.
            </p>
            <p className="mt-2">
              <strong>Opting Out:</strong> You can prevent Google Analytics tracking by
              installing the official Google Analytics Opt-out Browser Add-on.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Your Choices Regarding Cookies</h2>
            <p>You can control cookies in several ways:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>
                <strong>Browser Settings:</strong> Most browsers let you block or delete
                cookies. Note that doing so may affect functionality.
              </li>
              <li>
                <strong>Do Not Track (DNT):</strong> Some browsers support DNT, which signals
                that you don’t want tracking. We currently don’t respond to DNT signals, but
                you can manage cookies via browser settings.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Third-Party Links</h2>
            <p>
              Our site may include links to external websites. We are not responsible for the
              privacy practices or content of those sites. Always review their policies before
              sharing personal data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Data Security</h2>
            <p>
              We take reasonable measures to protect your data against unauthorised access or
              misuse. However, no system is completely secure, and we cannot guarantee absolute
              protection.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Data Retention</h2>
            <p>
              We keep your personal data only as long as necessary to fulfil the purposes
              outlined in this policy or as required by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Your Rights</h2>
            <p>You may have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Access or request a copy of your data.</li>
              <li>Correct inaccuracies in your information.</li>
              <li>Request deletion of your personal data.</li>
              <li>Object to or restrict processing.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us using the details below.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Updates will be reflected
              on this page, and the “Effective Date” below will be revised accordingly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data
              practices, please contact us at:{' '}
              <a
                href="mailto:help@flatstudios.net"
                className="text-blue-400 underline hover:text-blue-300"
              >
                help@flatstudios.net
              </a>
            </p>
          </div>

          <p className="text-sm text-white/60 pt-4 border-t border-white/10">
            Yapton &amp; District T/A Flat Studios <br />
            Effective Date: 6 October 2024
          </p>
        </section>
      </div>
    </main>
  );
}

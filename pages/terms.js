'use client';

export default function TermsOfService() {
  return (
    <main className="text-white px-6 py-12 flex justify-center">
      <div className="max-w-4xl w-full bg-[#283335] border border-white/20 backdrop-blur-md rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-white">
          Terms of Service
        </h1>

        <section className="space-y-6 text-white/80 leading-relaxed">
          <p className="text-sm text-white/60">
            Effective Date: <strong className="underline text-green-400">11th November 2025</strong>
          </p>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">1. Introduction</h2>
            <p>
              These Terms of Service (“Terms”) govern the use of any online services, systems, or applications operated by Yapton &amp; District T/A Flat Studios (“we”, “us”, or “our”), including those that allow users to link their Discord account using OAuth authentication.
              By accessing or using any of our connected systems or linking your Discord account, you agree to be bound by these Terms. If you do not agree, you must not use the service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">2. Use of Discord OAuth</h2>
            <p>
              When you link your Discord account, you authorise us to collect and use certain limited data from your Discord profile as permitted by Discord’s API. This may include:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Your Discord user ID</li>
              <li>Your username and discriminator (e.g. Username#1234)</li>
              <li>Your avatar image</li>
              <li>Your linked Discord servers or roles (if required for functionality)</li>
            </ul>
            <p className="mt-2">
              We do not have access to your Discord password, messages, or other private information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">3. Purpose of Data Collection</h2>
            <p>
              Information obtained through Discord OAuth is used solely for the operation of our connected systems. This may include:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Verifying your identity when accessing restricted areas (e.g. staff portals or game-linked systems)</li>
              <li>Linking your Discord account to in-game or administrative data</li>
              <li>Managing user permissions or roles</li>
              <li>Displaying basic Discord information (such as your username) within internal interfaces</li>
            </ul>
            <p className="mt-2">
              All information collected is handled in accordance with our Privacy Policy and is never sold or shared with unauthorised third parties.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">4. Revoking Access</h2>
            <p>
              You may revoke our access to your Discord account at any time by visiting your Discord User Settings → Authorised Apps and removing the connection. Once revoked, we will no longer be able to access or update your linked Discord information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">5. User Conduct</h2>
            <p>
              By using our services, you agree not to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Misuse or attempt to gain unauthorised access to any part of the system;</li>
              <li>Impersonate other users or falsify identity information;</li>
              <li>Exploit bugs, vulnerabilities, or security flaws;</li>
              <li>Engage in behaviour that violates Discord’s Terms of Service or Community Guidelines.</li>
            </ul>
            <p className="mt-2">
              Failure to comply may result in suspension or termination of access.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">6. Availability of Services</h2>
            <p>
              We make reasonable efforts to maintain availability of our services but cannot guarantee uninterrupted access. We may suspend, modify, or discontinue services at any time for maintenance, security, or operational reasons.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">7. Liability</h2>
            <p>
              Our services are provided “as is” without any warranty of accuracy, reliability, or suitability for any particular purpose.
              To the extent permitted by law, we are not liable for any indirect, incidental, or consequential loss arising from your use of or inability to use our services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">8. Changes to These Terms</h2>
            <p>
              We may update these Terms periodically. Any changes will be posted on this page with an updated effective date. Continued use of our services after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">9. Contact</h2>
            <p>
              For questions or concerns about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              Email: <a href="mailto:help@flatstudios.net" className="text-blue-400 underline hover:text-blue-300">help@flatstudios.net</a><br />
              Organisation: Yapton &amp; District T/A Flat Studios
            </p>
          </div>

          <p className="text-sm text-white/60 pt-4 border-t border-white/10">
            Yapton &amp; District T/A Flat Studios <br />
            Effective Date: <strong className="underline text-green-400">11th November 2025</strong>
          </p>
        </section>
      </div>
    </main>
  );
}

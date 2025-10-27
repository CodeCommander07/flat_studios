'use client';
import { useEffect, useState } from 'react';

export default function UnsubscribePage() {
  const [message, setMessage] = useState('Processing your request...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');

    if (!email) {
      setMessage('Invalid unsubscribe link.');
      return;
    }

    fetch(`/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) =>
        setMessage(data.success ? 'You have been unsubscribed successfully.' : data.message)
      )
      .catch(() => setMessage('Something went wrong. Please try again later.'));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f13] text-white text-center px-4">
      <div className="max-w-md bg-[#111827] p-8 rounded-2xl border border-white/10 shadow-lg">
        <h1 className="text-2xl font-semibold mb-3">Unsubscribe</h1>
        <p className="text-white/70">{message}</p>
        <p className="mt-6 text-sm text-white/50">
          Changed your mind?{' '}
          <a href="/email/manage" className="text-blue-400 hover:underline">
            Manage your preferences
          </a>
        </p>
      </div>
    </div>
  );
}

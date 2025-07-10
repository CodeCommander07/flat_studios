'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

export default function ExcelViewerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileParam = searchParams.get('file');

  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fileParam) {
      setError('No file specified.');
      return;
    }
    if (!/^[\w\-\.]+\.xlsx$/.test(fileParam)) {
      setError('Invalid file name.');
      return;
    }
    setFile(fileParam);
  }, [fileParam]);

  useEffect(() => {
    if (!file) return;

    async function fetchAndParse() {
      try {
        const response = await fetch(`/files/reports/${file}`);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        setSheetNames(workbook.SheetNames);
        setActiveSheet(workbook.SheetNames[0]);

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setData(jsonData);
        setError('');
      } catch (e) {
        setError(e.message);
      }
    }

    fetchAndParse();
  }, [file]);

  function changeSheet(sheetName) {
    setActiveSheet(sheetName);
    fetch(`/files/reports/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setData(jsonData);
      })
      .catch((err) => setError(err.message));
  }

  if (error)
    return (
      <div className="p-6 text-center text-red-600 font-semibold text-lg">
        Error: {error}
      </div>
    );
  if (!data)
    return (
      <div className="p-6 text-center text-gray-700 font-medium text-lg">
        Loading...
      </div>
    );

  return (
    <main className="max-w-9xl mx-auto p-6 font-sans text-gray-900 min-h-[calc(100vh-165px)]">
      <div className="mb-6 flex items-center justify-between bg-gray-900 rounded-xl p-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
        >
          Go Back
        </button>
        <h1 className="text-3xl font-bold text-white text-right flex-1">
          Viewing Excel file: <a href={`/files/reports/${file}`} className='text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-purple-500 to-indigo-400'>{file}</a>
        </h1>
      </div>

      <div className="overflow-x-auto rounded-2xl shadow-2xl bg-gray-800 border border-indigo-700">
        <table className="min-w-full border-separate border-spacing-y-3 border-spacing-x-0">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-indigo-300 rounded-xl">
              {data[0].map((cell, idx) => (
                <th
                  key={idx}
                  className="px-8 py-4 text-left font-semibold select-none shadow-sm"
                  style={{ minWidth: 140 }}
                >
                  {cell ?? ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(1).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="transition-colors duration-300 cursor-default "
              >
                {row.map((cell, cellIndex) => {


                  if (cellIndex === 0) {
                    return (
                      <td
                        key={cellIndex}
                        className="px-8 py-4 whitespace-nowrap font-medium cursor-pointer text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-indigo-400 hover:from-indigo-400 hover:to-red-600 transition"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/search/activity/staff?username=${encodeURIComponent(cell)}`);
                            if (!res.ok) throw new Error('User not found');
                            const data = await res.json();
                            if (!data?.userId) throw new Error('UserId missing in response');

                            // Navigate to user activity page
                            router.push(`/hub+/activity/${data.userId}`);
                          } catch (err) {
                            alert(err.message || 'Failed to find user');
                          }
                        }}
                      >
                        {cell}
                      </td>
                    );
                  }
                  let cellStyle = {};
                  let cellClass = "text-gray-200 px-8 py-4 whitespace-nowrap font-medium";

                  return (
                    <td
                      key={cellIndex}
                      className={cellClass}
                      style={{ ...cellStyle }}
                    >
                      {cell ?? ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>


        </table>
      </div>
    </main>
  );
}
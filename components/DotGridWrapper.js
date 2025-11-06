// components/DotGridWrapper.js
'use client';
import dynamic from 'next/dynamic';

const DotGrid = dynamic(() => import('./DotGrid'), { ssr: false });

export default function DotGridWrapper(props) {
  return <DotGrid {...props} />;
}

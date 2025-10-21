'use client';

import EnhancedProjectForm from './components/AutoProjectForm';
import { HiDocumentText } from 'react-icons/hi2';
import Link from 'next/link';

export default function Home() {

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 p-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <HiDocumentText className="text-4xl text-blue-500" />
              <h1 className="text-3xl font-bold text-white">
                Index Documentation
              </h1>
            </div>
            <Link
              href="/projects"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View Projects →
            </Link>
          </div>
          <p className="text-gray-400 mb-8">
            Upload documentation with metadata for intelligent multi-agent routing
          </p>

          <EnhancedProjectForm />
        </div>
      </div>
    </div>
  );
}

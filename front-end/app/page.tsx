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

          <div className="mt-8 pt-8 border-t border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">💡 Tips:</h2>
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-md text-sm space-y-2">
              <p className="text-gray-400">
                <span className="text-blue-400">•</span> Add tech stack (e.g., Solidity, Hardhat) to enable smart routing
              </p>
              <p className="text-gray-400">
                <span className="text-blue-400">•</span> Select domain for better project categorization
              </p>
              <p className="text-gray-400">
                <span className="text-blue-400">•</span> Keywords help agents find relevant documentation faster
              </p>
              <p className="text-gray-400">
                <span className="text-blue-400">•</span> Supports both <code className="px-1 py-0.5 bg-gray-700 rounded">.md</code> and <code className="px-1 py-0.5 bg-gray-700 rounded">.mdx</code> files
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

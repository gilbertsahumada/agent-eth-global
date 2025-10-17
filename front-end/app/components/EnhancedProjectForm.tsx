'use client';

import { useState } from 'react';
import { HiCloudArrowUp, HiCheckCircle, HiPlus, HiXMark } from 'react-icons/hi2';

interface EnhancedProjectFormProps {
  onSuccess?: () => void;
}

export default function EnhancedProjectForm({ onSuccess }: EnhancedProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
    techStack: [] as string[],
    tags: [] as string[],
    keywords: [] as string[]
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Input states for array fields
  const [techStackInput, setTechStackInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isMarkdown = selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.mdx');
      if (!isMarkdown) {
        setMessage({ type: 'error', text: 'Please upload a .md or .mdx file' });
        return;
      }
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const addToArray = (field: 'techStack' | 'tags' | 'keywords', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      // Clear input
      if (field === 'techStack') setTechStackInput('');
      if (field === 'tags') setTagInput('');
      if (field === 'keywords') setKeywordInput('');
    }
  };

  const removeFromArray = (field: 'techStack' | 'tags' | 'keywords', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('domain', formData.domain);
      formDataToSend.append('techStack', JSON.stringify(formData.techStack));
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      formDataToSend.append('keywords', JSON.stringify(formData.keywords));
      formDataToSend.append('file', file);

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Project indexed successfully!' });
        setFormData({
          name: '',
          description: '',
          domain: '',
          techStack: [],
          tags: [],
          keywords: []
        });
        setFile(null);
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error indexing project' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            id="name"
            required
            placeholder="e.g: chainlink-vrf"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-300 mb-2">
            Domain
          </label>
          <select
            id="domain"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">Select domain...</option>
            <option value="DeFi">DeFi</option>
            <option value="NFT">NFT</option>
            <option value="Gaming">Gaming</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Oracles">Oracles</option>
            <option value="Smart Contracts">Smart Contracts</option>
            <option value="Tools">Tools</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="Brief project description..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
        />
      </div>

      {/* Tech Stack */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tech Stack
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="e.g: Solidity, Hardhat..."
            value={techStackInput}
            onChange={(e) => setTechStackInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('techStack', techStackInput))}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <button
            type="button"
            onClick={() => addToArray('techStack', techStackInput)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <HiPlus className="text-xl" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.techStack.map((tech, idx) => (
            <span key={idx} className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm flex items-center gap-2">
              {tech}
              <button type="button" onClick={() => removeFromArray('techStack', idx)} className="hover:text-white">
                <HiXMark />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="e.g: deployment, testing..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('tags', tagInput))}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <button
            type="button"
            onClick={() => addToArray('tags', tagInput)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <HiPlus className="text-xl" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, idx) => (
            <span key={idx} className="px-3 py-1 bg-purple-900 text-purple-200 rounded-full text-sm flex items-center gap-2">
              {tag}
              <button type="button" onClick={() => removeFromArray('tags', idx)} className="hover:text-white">
                <HiXMark />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Keywords (for routing)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="e.g: deploy, compile, test..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('keywords', keywordInput))}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <button
            type="button"
            onClick={() => addToArray('keywords', keywordInput)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <HiPlus className="text-xl" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.keywords.map((keyword, idx) => (
            <span key={idx} className="px-3 py-1 bg-green-900 text-green-200 rounded-full text-sm flex items-center gap-2">
              {keyword}
              <button type="button" onClick={() => removeFromArray('keywords', idx)} className="hover:text-white">
                <HiXMark />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-300 mb-2">
          Upload Markdown File *
        </label>
        <input
          type="file"
          id="file"
          accept=".md,.mdx"
          onChange={handleFileChange}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
        />
        {file && (
          <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
            <HiCheckCircle className="text-green-500" /> Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Supports both .md (Markdown) and .mdx files
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-md border ${message.type === 'success'
          ? 'bg-green-950 border-green-800 text-green-400'
          : 'bg-red-950 border-red-800 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Indexing...
          </>
        ) : (
          <>
            <HiCloudArrowUp className="text-xl" />
            Index Project
          </>
        )}
      </button>
    </form>
  );
}

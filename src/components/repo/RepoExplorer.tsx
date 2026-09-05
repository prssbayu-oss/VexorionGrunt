import React, { useState } from 'react';
import { REPO_FILES, RepoFile } from '../../data/repo-files';
import { ArchitecturePipeline } from './ArchitecturePipeline';
import { FileSearchSidebar } from './FileSearchSidebar';
import { CodeViewerPane } from './CodeViewerPane';

export const RepoExplorer: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>(REPO_FILES[0].path);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const selectedFile: RepoFile =
    REPO_FILES.find((f) => f.path === selectedPath) || REPO_FILES[0];

  const filteredFiles = REPO_FILES.filter((file) => {
    const matchesSearch =
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || file.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* 1. Architecture Flowchart Component */}
      <ArchitecturePipeline />

      {/* 2. Repository Explorer Section */}
      <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Component */}
        <div className="lg:col-span-4 min-w-0">
          <FileSearchSidebar
            files={filteredFiles}
            selectedPath={selectedPath}
            onSelectPath={setSelectedPath}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

        {/* Code Viewer Component */}
        <div className="lg:col-span-8 min-w-0">
          <CodeViewerPane selectedFile={selectedFile} />
        </div>
      </div>
    </div>
  );
};

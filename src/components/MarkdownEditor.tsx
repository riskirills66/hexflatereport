import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Eye, 
  Edit3, 
  FileText, 
  Bold,
  Italic,
  List,
  Link,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Trash2,
  Search,
  Copy,
  ExternalLink,
  Image
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { getCachedMarkdownFiles, setCachedMarkdownFiles, getCachedMarkdownFile, setCachedMarkdownFile, removeCachedMarkdownFile, mergeMarkdownFiles } from '../utils/markdownCache';

interface MarkdownEditorProps {
  authSeed: string;
  onNavigate: (screen: string) => void;
}

export interface MarkdownEditorRef {
  refresh: () => void;
  showNewFileDialog: () => void;
  saveCurrentFile: () => void;
  downloadMarkdown: () => void;
  backToFiles: () => void;
  currentFile: MarkdownFile | null;
  saving: boolean;
}

interface MarkdownFile {
  filename: string;
  title: string;
  content: string;
  created_at?: string;
  modified_at?: string;
  size: number;
}

const MarkdownEditor = React.forwardRef<MarkdownEditorRef, MarkdownEditorProps>(({ authSeed }, ref) => {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [currentFile, setCurrentFile] = useState<MarkdownFile | null>(null);
  const [content, setContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showToolbar] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  React.useImperativeHandle(ref, () => ({
    refresh: loadMarkdownFiles,
    showNewFileDialog: () => setShowNewFileDialog(true),
    saveCurrentFile,
    downloadMarkdown,
    backToFiles: handleBackToFiles,
    currentFile,
    saving,
  }));

  const loadMarkdownFiles = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'No admin session found' });
        }
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFiles(prev => {
            if (prev.length === 0) {
              return data.files || [];
            }
            return mergeMarkdownFiles(prev, data.files || []);
          });
          setCachedMarkdownFiles(data.files || []);
        } else {
          if (!background) {
            setMessage({ type: 'error', text: data.message || 'Failed to load markdown files' });
          }
        }
      } else {
        if (!background) {
          setMessage({ type: 'error', text: 'Failed to load markdown files' });
        }
      }
    } catch (error) {
      console.error('Error loading markdown files:', error);
      if (!background) {
        setMessage({ type: 'error', text: 'Error loading markdown files' });
      }
    }
  }, [authSeed]);

  useEffect(() => {
    // Load from cache immediately
    const cached = getCachedMarkdownFiles();
    if (cached) {
      setFiles(cached);
    }

    // Fetch from API in background
    loadMarkdownFiles(true);

    // Get the base URL for raw markdown links
    getApiUrl('/').then(url => {
      setBaseUrl(url.replace(/\/$/, '')); // Remove trailing slash
    });
  }, [loadMarkdownFiles]);

  const loadFile = async (filename: string) => {
    // Load from cache immediately
    const cached = getCachedMarkdownFile(filename);
    if (cached) {
      setCurrentFile(cached);
      setContent(cached.content);
    }

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'No admin session found' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns/get');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.file) {
          setCurrentFile(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(data.file)) {
              return prev;
            }
            return data.file;
          });
          setContent(data.file.content);
          setCachedMarkdownFile(filename, data.file);
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to load file' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to load file' });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setMessage({ type: 'error', text: 'Error loading file' });
    }
  };

  const saveCurrentFile = async () => {
    if (!currentFile) return;

    setSaving(true);
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'No admin session found' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns/save');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ 
          filename: currentFile.filename,
          content 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'File saved successfully!' });
          setLastSaved(new Date());
          // Update the current file with new data
          if (data.file) {
            const updatedFile = { ...data.file, content };
            setCurrentFile(updatedFile);
            setCachedMarkdownFile(currentFile.filename, updatedFile);
            
            // Update file in files list
            setFiles(prev => {
              const updated = prev.map(f => 
                f.filename === currentFile.filename ? updatedFile : f
              );
              setCachedMarkdownFiles(updated);
              return updated;
            });
          }
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to save file' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to save file' });
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setMessage({ type: 'error', text: 'Error saving file' });
    } finally {
      setSaving(false);
    }
  };

  const createNewFile = async () => {
    if (!newFileName.trim()) return;

    const filename = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
    const newContent = `# ${newFileName.replace('.md', '').replace(/[-_]/g, ' ')}\n\nStart writing your content here...\n`;

    setSaving(true);
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'No admin session found' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns/save');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ 
          filename,
          content: newContent
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'New file created successfully!' });
          setNewFileName('');
          setShowNewFileDialog(false);
          // Load the new file
          if (data.file) {
            setCurrentFile(data.file);
            setContent(data.file.content);
            setCachedMarkdownFile(data.file.filename, data.file);
            
            // Add to files list
            setFiles(prev => {
              const updated = [...prev, data.file];
              setCachedMarkdownFiles(updated);
              return updated;
            });
          }
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to create file' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to create file' });
      }
    } catch (error) {
      console.error('Error creating file:', error);
      setMessage({ type: 'error', text: 'Error creating file' });
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async (filename: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'No admin session found' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns/delete');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'File deleted successfully!' });
          // If we deleted the current file, clear it
          if (currentFile && currentFile.filename === filename) {
            setCurrentFile(null);
            setContent('');
          }
          // Remove from files list and cache
          setFiles(prev => {
            const updated = prev.filter(f => f.filename !== filename);
            setCachedMarkdownFiles(updated);
            return updated;
          });
          removeCachedMarkdownFile(filename);
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to delete file' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to delete file' });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setMessage({ type: 'error', text: 'Error deleting file' });
    }
  };

  const handleBackToFiles = () => {
    setCurrentFile(null);
    setContent('');
  };

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = before + selectedText + after;
    
    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + text + content.substring(start);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const downloadMarkdown = () => {
    if (!currentFile) return;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  const copyRawUrl = (filename: string) => {
    const rawUrl = `${baseUrl}/markdown/${filename}`;
    navigator.clipboard.writeText(rawUrl);
    setMessage({ type: 'success', text: 'Raw URL copied to clipboard!' });
  };

  const openRawUrl = (filename: string) => {
    const rawUrl = `${baseUrl}/markdown/${filename}`;
    window.open(rawUrl, '_blank');
  };

  const insertImage = () => {
    setShowImageDialog(true);
  };

  const handleImageInsert = () => {
    if (!imageUrl.trim()) return;
    
    const altText = imageAlt.trim() || 'Image';
    const imageMarkdown = `![${altText}](${imageUrl})`;
    insertAtCursor(imageMarkdown);
    
    // Reset form
    setImageUrl('');
    setImageAlt('');
    setShowImageDialog(false);
  };

  const cancelImageInsert = () => {
    setImageUrl('');
    setImageAlt('');
    setShowImageDialog(false);
  };

  const renderPreview = () => {
    if (!content.trim()) {
      return { __html: '<p class="text-gray-500 italic">Start typing to see preview...</p>' };
    }

    // Enhanced markdown to HTML conversion
    let html = content
      // Headers (must be processed first)
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Bold and italic (process bold first to avoid conflicts)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Code
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Images (must be processed before links to avoid conflicts)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-sm my-4" loading="lazy" />')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-2">$1</blockquote>')
      // Lists - unordered
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Lists - ordered
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>');

    // Wrap content in paragraphs
    html = '<p class="mb-3">' + html + '</p>';

    // Process lists properly
    html = html.replace(/(<li class="ml-4">.*?<\/li>)/g, (match) => {
      return '<ul class="list-disc list-inside mb-3">' + match + '</ul>';
    });

    // Clean up empty paragraphs and fix list formatting
    html = html
      .replace(/<p class="mb-3"><\/p>/g, '')
      .replace(/<p class="mb-3"><ul/g, '<ul')
      .replace(/<\/ul><\/p>/g, '</ul>')
      .replace(/<p class="mb-3"><h/g, '<h')
      .replace(/<\/h[1-6]><\/p>/g, (match) => match.replace('</p>', ''));

    return { __html: html };
  };

  const filteredFiles = files.filter(file => 
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {currentFile ? (
        <>
          {/* Message */}
          {message && (
            <div className={`mx-6 mt-4 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Toolbar */}
              {showToolbar && (
                <div className="bg-white border-b border-gray-200 px-6 py-2 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* View Mode Toggle */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewMode('edit')}
                          className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-2 ${
                            viewMode === 'edit' 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setViewMode('preview')}
                          className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-2 ${
                            viewMode === 'preview' 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Preview</span>
                        </button>
                      </div>

                      {/* Markdown Tools */}
                      {viewMode === 'edit' && (
                        <div className="flex items-center space-x-1 border-l border-gray-300 pl-4">
                          <button
                            onClick={() => insertMarkdown('**', '**')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Bold"
                          >
                            <Bold className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('*', '*')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Italic"
                          >
                            <Italic className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('`', '`')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Code"
                          >
                            <Code className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('# ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Heading 1"
                          >
                            <Heading1 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('## ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Heading 2"
                          >
                            <Heading2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('### ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Heading 3"
                          >
                            <Heading3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('- ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Bullet List"
                          >
                            <List className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('> ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Quote"
                          >
                            <Quote className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('[', '](url)')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Link"
                          >
                            <Link className="h-4 w-4" />
                          </button>
                          <button
                            onClick={insertImage}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Image"
                          >
                            <Image className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Editor Settings */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Font Size:</label>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value={12}>12px</option>
                          <option value={14}>14px</option>
                          <option value={16}>16px</option>
                          <option value={18}>18px</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Content */}
              <div className="flex-1 flex flex-col p-3 min-h-0">
                <div className="w-full flex-1 flex flex-col min-h-0">
                  {viewMode === 'edit' ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
                      <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full flex-1 p-3 border-0 resize-none focus:outline-none font-mono overflow-auto min-h-0"
                        style={{
                          fontSize: `${fontSize}px`,
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}
                        placeholder="Start writing your markdown content..."
                        spellCheck={false}
                      />
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
                      <div className="p-3 flex-1 overflow-auto min-h-0">
                        {content.trim() ? (
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={renderPreview()}
                          />
                        ) : (
                          <div className="text-gray-500 italic text-center py-8">
                            Start typing in edit mode to see the preview...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-gray-200 px-6 py-2 flex-shrink-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>File: {currentFile.filename}</span>
                    {lastSaved && (
                      <span>Last saved: {lastSaved.toLocaleString()}</span>
                    )}
                    {baseUrl && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">Raw URL:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {baseUrl}/markdown/{currentFile.filename}
                        </span>
                        <button
                          onClick={() => copyRawUrl(currentFile.filename)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy raw URL"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => openRawUrl(currentFile.filename)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Open raw URL"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>Characters: {content.length}</span>
                    <span>Lines: {content.split('\n').length}</span>
                    <span>Words: {content.split(/\s+/).filter(word => word.length > 0).length}</span>
                  </div>
                </div>
              </div>
          </div>
        </>
      ) : (
        <>
          {/* Message */}
          {message && (
            <div className={`mx-6 mt-4 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* File List View */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* File Grid */}
            {filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'No files found' : 'No markdown files'}
                  </h3>
                  {!searchQuery && (
                    <p className="text-gray-500 mb-4">Create your first markdown file to get started</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <div
                    key={file.filename}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
                    onClick={() => loadFile(file.filename)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                          {file.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate mb-2">
                          {file.filename}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-400">
                          <span>{file.size} bytes</span>
                          {file.modified_at && (
                            <span>• {new Date(file.modified_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteFile(file.filename, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-opacity"
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {baseUrl && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 font-mono truncate flex-1">
                            {baseUrl}/markdown/{file.filename}
                          </span>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyRawUrl(file.filename);
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                              title="Copy raw URL"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRawUrl(file.filename);
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                              title="Open raw URL"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New File</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Name
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="my-document.md"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewFileDialog(false);
                  setNewFileName('');
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createNewFile}
                disabled={!newFileName.trim() || saving}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insert Image</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alt Text (optional)
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Description of the image"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelImageInsert}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImageInsert}
                disabled={!imageUrl.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;

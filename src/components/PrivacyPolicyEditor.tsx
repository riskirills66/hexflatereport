import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, 
  RefreshCw, 
  Eye, 
  Edit3, 
  FileText, 
  Download, 
  Upload,
  Bold,
  Italic,
  List,
  Link,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { getCachedPrivacyPolicy, setCachedPrivacyPolicy } from '../utils/privacyPolicyCache';

interface PrivacyPolicyEditorProps {
  authSeed: string;
  onNavigate: (screen: string) => void;
}


const PrivacyPolicyEditor: React.FC<PrivacyPolicyEditorProps> = ({ authSeed }) => {
  const [content, setContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showToolbar] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const loadPrivacyPolicy = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'No admin session found' });
        }
        return;
      }

      const apiUrl = await getApiUrl('/admin/privacy-policy');
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
        if (data.success && data.content) {
          setContent(prev => {
            if (prev === data.content) {
              return prev;
            }
            return data.content;
          });
          setCachedPrivacyPolicy(data.content);
        } else {
          if (!background) {
            setMessage({ type: 'error', text: data.message || 'Failed to load privacy policy' });
          }
        }
      } else {
        if (!background) {
          setMessage({ type: 'error', text: 'Failed to load privacy policy' });
        }
      }
    } catch (error) {
      console.error('Error loading privacy policy:', error);
      if (!background) {
        setMessage({ type: 'error', text: 'Error loading privacy policy' });
      }
    }
  }, [authSeed]);

  useEffect(() => {
    // Load from cache immediately
    const cached = getCachedPrivacyPolicy();
    if (cached) {
      setContent(cached);
    }

    // Fetch from API in background
    loadPrivacyPolicy(true);
  }, [loadPrivacyPolicy]);

  const savePrivacyPolicy = async () => {
    setSaving(true);
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'No admin session found' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/privacy-policy/save');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Privacy policy saved successfully!' });
          setLastSaved(new Date());
          setCachedPrivacyPolicy(content);
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to save privacy policy' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to save privacy policy' });
      }
    } catch (error) {
      console.error('Error saving privacy policy:', error);
      setMessage({ type: 'error', text: 'Error saving privacy policy' });
    } finally {
      setSaving(false);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

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
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + text + content.substring(start);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PRIVACY_POLICY.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uploadMarkdown = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
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
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
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

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">Privacy Policy Editor</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".md,.txt"
                  onChange={uploadMarkdown}
                  className="hidden"
                  id="upload-markdown"
                />
                <label
                  htmlFor="upload-markdown"
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </label>
              </div>
              
              <button
                onClick={downloadMarkdown}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              
              <button
                onClick={() => loadPrivacyPolicy(false)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={savePrivacyPolicy}
                disabled={saving}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-3 min-h-0">
        <div className="w-full flex-1 flex flex-col min-h-0">
          {viewMode === 'edit' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
              <textarea
                id="markdown-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 p-3 border-0 resize-none focus:outline-none font-mono overflow-auto min-h-0"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}
                placeholder="Start writing your privacy policy in Markdown..."
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
            {lastSaved && (
              <span>Last saved: {lastSaved.toLocaleString()}</span>
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
  );
};

export default PrivacyPolicyEditor;

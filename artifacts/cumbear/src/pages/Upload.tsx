import { useState, useRef } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { Gender } from '../types';
import { Upload as UploadIcon, Link, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

type UploadMode = 'link' | 'video';

export default function Upload() {
  const [selectedGender, setSelectedGender] = useState<Gender>('All');
  const [mode, setMode] = useState<UploadMode>('link');
  const [linkUrl, setLinkUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Amateur');
  const [tags, setTags] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024;
    // const MAX_DURATION = 180; // reserved for future validation

  const categories = [
    'Amateur', 'POV', 'Mom', 'Stepsister', 'Russian', 'Tall', 'Curvy',
    'Slim', 'MILF', 'Chubby', 'Anal', 'Blowjob', 'Threesome', 'Gangbang',
    'Interracial', 'Latina', 'Ebony', 'Asian', 'Blonde', 'Brunette', 'Redhead',
    'Teen', 'Mature', 'Creampie', 'Public'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    setUploadStatus('idle');
    setErrorMessage('');

    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus('error');
      setErrorMessage('File size exceeds 50MB limit. Please upload a smaller file.');
      return;
    }

    if (!file.type.startsWith('video/')) {
      setUploadStatus('error');
      setErrorMessage('Invalid file type. Please upload a video file (MP4, WebM, etc.).');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus('success');
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setUploadStatus('error');
      setErrorMessage('Please enter a valid video URL.');
      return;
    }
    setUploadStatus('success');
    setLinkUrl('');
    setTitle('');
    setTags('');
  };

  return (
    <div className="min-h-screen bg-cumbear-black pb-16">
      <Header selectedGender={selectedGender} onGenderChange={setSelectedGender} />

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 rounded-full bg-cumbear-red" />
          <h1 className="text-xl font-bold text-white">Upload</h1>
        </div>

        <div className="flex bg-cumbear-card rounded-xl p-1 mb-6 border border-cumbear-border">
          <button
            onClick={() => { setMode('link'); setUploadStatus('idle'); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              mode === 'link'
                ? "bg-cumbear-red text-white"
                : "text-cumbear-text-muted hover:text-white"
            )}
          >
            <Link className="w-4 h-4" />
            Submit Link
          </button>
          <button
            onClick={() => { setMode('video'); setUploadStatus('idle'); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              mode === 'video'
                ? "bg-cumbear-red text-white"
                : "text-cumbear-text-muted hover:text-white"
            )}
          >
            <Video className="w-4 h-4" />
            Upload Video
          </button>
        </div>

        {mode === 'link' && (
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Video URL *</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/video/123"
                className="w-full bg-cumbear-card border border-cumbear-border rounded-lg px-4 py-3 text-white text-sm placeholder-cumbear-text-dim focus:border-cumbear-red focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className="w-full bg-cumbear-card border border-cumbear-border rounded-lg px-4 py-3 text-white text-sm placeholder-cumbear-text-dim focus:border-cumbear-red focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-cumbear-card border border-cumbear-border rounded-lg px-4 py-3 text-white text-sm focus:border-cumbear-red focus:outline-none transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-cumbear-card">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="amateur, pov, hot, new"
                className="w-full bg-cumbear-card border border-cumbear-border rounded-lg px-4 py-3 text-white text-sm placeholder-cumbear-text-dim focus:border-cumbear-red focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-cumbear-red text-white font-medium text-sm hover:bg-cumbear-red-hover transition-colors flex items-center justify-center gap-2"
            >
              <UploadIcon className="w-4 h-4" />
              Submit Link
            </button>
          </form>
        )}

        {mode === 'video' && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                dragActive
                  ? "border-cumbear-red bg-cumbear-red/5"
                  : "border-cumbear-border bg-cumbear-card hover:border-cumbear-red/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-cumbear-red/10 flex items-center justify-center mx-auto mb-3">
                <UploadIcon className="w-6 h-6 text-cumbear-red" />
              </div>
              <p className="text-white font-medium text-sm mb-1">
                {dragActive ? 'Drop your video here' : 'Click or drag video here'}
              </p>
              <p className="text-cumbear-text-dim text-xs">
                MP4, WebM, MOV up to 50MB and 3 minutes
              </p>
            </div>

            <div className="bg-cumbear-card border border-cumbear-border rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-cumbear-red" />
                Upload Rules
              </h3>
              <ul className="text-xs text-cumbear-text-muted space-y-1.5">
                <li>Maximum file size: 50MB</li>
                <li>Maximum duration: 3 minutes (180 seconds)</li>
                <li>Supported formats: MP4, WebM, MOV</li>
                <li>Uploaded videos appear in Shorts section</li>
                <li>All uploads are reviewed before going live</li>
                <li>Illegal content will be removed and reported</li>
              </ul>
            </div>
          </div>
        )}

        {uploadStatus === 'uploading' && (
          <div className="mt-4 bg-cumbear-card border border-cumbear-border rounded-xl p-4">
            <p className="text-sm text-white mb-2">Uploading...</p>
            <div className="w-full h-2 bg-cumbear-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-cumbear-red rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-cumbear-text-muted mt-1">{uploadProgress}%</p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-400">Upload Successful!</p>
              <p className="text-xs text-green-400/70 mt-0.5">
                {mode === 'link' ? 'Your link has been submitted for review.' : 'Your video has been uploaded and will appear in Shorts after review.'}
              </p>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Upload Failed</p>
              <p className="text-xs text-red-400/70 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}


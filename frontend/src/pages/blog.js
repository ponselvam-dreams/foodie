// src/pages/blogs.js

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import initialBlogs from '../data/initialBlogs';

// Simple slug generator (safe for filenames / URLs)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Blog card component
function BlogCard({ blog, onTagClick }) {
  return (
    <article className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {blog.featured_image_url ? (
        <img src={blog.featured_image_url} alt={blog.title} className="object-cover w-full h-48" />
      ) : (
        <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      )}

      <div className="p-4">
        <h2 className="text-lg font-semibold mb-1">
          <Link to={`/blog/${blog.slug}`} className="hover:underline">{blog.title}</Link>
        </h2>
        <p className="text-sm text-gray-500 mb-3">{new Date(blog.published_at).toLocaleDateString()}</p>

        <div className="text-gray-700 mb-3 text-sm line-clamp-4">
          <ReactMarkdown>{blog.excerpt || (blog.content || '').slice(0, 250) + '...'}</ReactMarkdown>
        </div>

        <div className="flex gap-2 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {blog.tags?.slice(0, 3).map(t => (
              <button
                key={t}
                onClick={() => onTagClick(t)}
                className="text-xs bg-gray-100 px-2 py-1 rounded-full"
              >
                {t}
              </button>
            ))}
          </div>

          <Link to={`/blog/${blog.slug}`} className="text-sm text-indigo-600 hover:underline">Read →</Link>
        </div>
      </div>
    </article>
  );
}

// Modal component for adding blog
function AddBlogModal({ open, onClose, onCreate, existingTags }) {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [author, setAuthor] = useState('');

  function reset() {
    setTitle(''); setExcerpt(''); setContent('');
    setTags(''); setFeaturedImageUrl(''); setVideoUrl(''); setAuthor('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return alert('Title is required');

    const newBlog = {
      id: `b-${Date.now()}`,
      title: title.trim(),
      slug: slugify(title),
      excerpt: excerpt.trim() || (content || '').slice(0, 150),
      content: content || '',
      featured_image_url: featuredImageUrl || '',
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      video_urls: videoUrl ? [videoUrl.trim()] : [],
      author: { name: author || 'Anonymous' },
      published_at: new Date().toISOString(),
    };

    onCreate(newBlog);
    reset();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 z-10">
        <header className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New Blog</h3>
          <button className="text-gray-500" onClick={onClose}>✕</button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">Excerpt</label>
            <input value={excerpt} onChange={e => setExcerpt(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">Content (Markdown)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Tags (comma-separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder={existingTags.join(', ')} />
            </div>

            <div>
              <label className="block text-sm font-medium">Featured Image URL</label>
              <input value={featuredImageUrl} onChange={e => setFeaturedImageUrl(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">YouTube / Video URL</label>
              <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium">Author</label>
              <input value={author} onChange={e => setAuthor(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => { reset(); onClose(); }} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // derive tags from blogs
  const tags = useMemo(() => Array.from(new Set(blogs.flatMap(b => b.tags || []))), [blogs]);

  // filtered results
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = search
      ? (blog.title || '').toLowerCase().includes(search.toLowerCase())
        || (blog.excerpt || '').toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesTag = tag ? (blog.tags || []).includes(tag) : true;
    return matchesSearch && matchesTag;
  });

  function handleCreateBlog(newBlog) {
    // ensure unique slug if duplicate title
    let slug = newBlog.slug;
    let counter = 1;
    while (blogs.some(b => b.slug === slug)) {
      slug = `${newBlog.slug}-${counter++}`;
    }
    newBlog.slug = slug;

    setBlogs(prev => [newBlog, ...prev]);
    // optional: update tags happens automatically because tags derive from blogs via useMemo
  }

  function handleTagClick(t) {
    setTag(t);
    setSearch('');
  }

  function clearFilters() {
    setSearch('');
    setTag('');
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Foodiee Blog</h1>
          <p className="text-gray-600">Recipes, chef stories, how-tos and video guides.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded shadow-sm hover:bg-green-700">
            + Add Blog
          </button>
        </div>
      </header>

      <section className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          placeholder="Search recipes, ingredients or chef..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <div className="flex items-center gap-3">
          <select value={tag} onChange={e => setTag(e.target.value)} className="border rounded-lg px-3 py-2 bg-white">
            <option value="">All Tags</option>
            {tags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button onClick={clearFilters} className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50">Clear</button>
        </div>
      </section>

      <main>
        {filteredBlogs.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No blogs found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map(blog => (
              <BlogCard key={blog.id} blog={blog} onTagClick={handleTagClick} />
            ))}
          </div>
        )}
      </main>

      <AddBlogModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateBlog}
        existingTags={tags}
      />
    </div>
  );
}

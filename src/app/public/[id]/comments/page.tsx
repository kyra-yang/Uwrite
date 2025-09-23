'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ProjectInfo {
  id: string;
  title: string;
  owner: {
    name: string;
  };
}

export default function CommentsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [comments, setComments] = useState<Comment[]>([]);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
    fetchProjectInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProjectInfo = async () => {
    try {
      const response = await fetch(`/api/public/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Fetching comments failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [comment, ...prev]);
        setNewComment('');
      } else if (response.status === 401) {
        if (confirm('Please login to comment.')) router.push('/login');
      } else {
        const error = await response.json();
        alert(error.error || 'Comment failed, please try again.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Something went wrong, please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Link
          href={`/public/${projectId}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to story
        </Link>

        {project && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.title}</h1>
            <p className="text-gray-600 mb-8">Author: {project.owner.name}</p>
          </>
        )}

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            All comments for this project ({comments.length})
          </h2>

          {/* Write new comment */}
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment here... please be kind and respectful *-*"
              className="w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={sending || !newComment.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Publishing...' : 'Publish comment'}
              </button>
            </div>
          </form>

          {/* Comments list */}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          {comments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Be the first to comment! Remember to be kind and respectful *-*
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-semibold text-gray-800">
                      {comment.user.name || comment.user.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

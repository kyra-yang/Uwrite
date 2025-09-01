'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CommentsSectionProps {
  projectId: string;
  showAll?: boolean;
  maxDisplay?: number;
  isLoggedIn?: boolean;
  userId?: string;
}

export default function CommentsSection({ 
  projectId, 
  showAll = false, 
  maxDisplay = 3,
  isLoggedIn = false,
  userId
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');

  // fetch comments
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('fetch comments fail: ', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  // give comments
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('please login first to comment');
      return;
    }

    if (!newComment.trim()) {
      alert('you cannot leave an empty comment');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) {
        throw new Error('submit comment failed');
      }

      const newCommentData = await response.json();
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('submit comment failed: ', error);
      alert('submit comment failed, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // format the time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString('zh-CN');
  };

  const displayComments = showAll ? comments : comments.slice(0, maxDisplay);
  const hasMoreComments = !showAll && comments.length > maxDisplay;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* title */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          comment ({comments.length})
        </h3>
      </div>

      {/* input */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="write down your comment here...(please be kind and respectful *-*)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'publishing' : 'publish comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            <Link href="/auth/signin" className="text-blue-500 hover:underline">
              login
            </Link>
            {' '}to join the discussion and leave your comments!
          </p>
        </div>
      )}

      {/* comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>You are the first one! Leave something here! Remember to be kind and resppectful*-*</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {comment.user.name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {/* view all comments */}
          {hasMoreComments && (
            <div className="text-center pt-4 border-t border-gray-100">
              <Link
                href={`/public/${projectId}/comments`}
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 hover:underline"
              >
                <MessageCircle className="w-4 h-4" />
                view the rest {comments.length} comments
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
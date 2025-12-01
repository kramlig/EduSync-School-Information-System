/**
 * AnnouncementsView - School Announcements (Optimized UI/UX)
 * 
 * Modern, optimized component for managing school announcements.
 * Features pagination, search, target audience filtering, and role-based access.
 * 
 * Features:
 * - Real-time announcements with search
 * - CRUD operations (Create, Read, Update, Delete)
 * - Target audience filtering (All, Staff, Students, Parents)
 * - Pagination for large datasets
 * - Responsive design with dark mode
 * - Toast notifications
 * - Optimistic UI updates
 * - Performance optimizations with React.memo and useMemo
 */

import React, { useState, useMemo, useCallback } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { Announcement, AuthUser, StudentUser, ParentUser } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon, SearchIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';

interface AnnouncementsViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const ITEMS_PER_PAGE = 10;

const AnnouncementsView: React.FC<AnnouncementsViewProps> = React.memo(({ schoolData, session }) => {
    const { announcements, teachers, addAnnouncement, updateAnnouncement, deleteAnnouncement } = schoolData;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [announcementToEdit, setAnnouncementToEdit] = useState<Partial<Announcement> | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [targetFilter, setTargetFilter] = useState<'all' | 'staff' | 'students' | 'parents' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Toast notification state
    const [toast, setToast] = useState<{
        show: boolean;
        type: 'success' | 'error';
        message: string;
        details?: string;
    }>({ show: false, type: 'success', message: '' });

    // Show toast helper
    const showToast = useCallback((type: 'success' | 'error', message: string, details?: string) => {
        setToast({ show: true, type, message, details });
        setTimeout(() => setToast({ show: false, type: 'success', message: '' }), 5000);
    }, []);

    const authUser = session.user as AuthUser;
    const canManage = session.type === 'staff' && ['admin', 'principal'].includes(authUser.role);

    // Get target badge styling
    const getTargetBadge = (target: string) => {
        const badges = {
            all: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            staff: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            students: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            parents: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        };
        return badges[target as keyof typeof badges] || badges.all;
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = today.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
        });
    };

    // Filter and search announcements
    const filteredAnnouncements = useMemo(() => {
        let filtered = announcements;
        
        // Filter by user type
        if (session.type !== 'staff') {
            const targetAudience = session.type === 'parent' ? 'parents' : session.type === 'student' ? 'students' : session.type;
            filtered = filtered.filter(a => a.target === 'all' || a.target === targetAudience);
        }
        
        // Filter by selected target (for admins)
        if (targetFilter) {
            filtered = filtered.filter(a => a.target === targetFilter);
        }

        // Search filter
        if (debouncedSearchQuery) {
            const lowerQuery = debouncedSearchQuery.toLowerCase();
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(lowerQuery) ||
                a.content.toLowerCase().includes(lowerQuery) ||
                a.authorName?.toLowerCase().includes(lowerQuery)
            );
        }

        return filtered;
    }, [announcements, session.type, targetFilter, debouncedSearchQuery]);

    // Sort by date (newest first)
    const sortedAnnouncements = useMemo(() => 
        [...filteredAnnouncements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [filteredAnnouncements]);

    // Pagination
    const totalPages = Math.ceil(sortedAnnouncements.length / ITEMS_PER_PAGE);
    const paginatedAnnouncements = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAnnouncements.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedAnnouncements, currentPage]);

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, targetFilter]);

    const handleOpenModal = (announcement: Announcement | null = null) => {
        if (!canManage) return;
        setAnnouncementToEdit(announcement 
            ? { ...announcement } 
            : { 
                target: 'all', 
                date: new Date().toISOString().split('T')[0], 
                authorId: authUser.id,
                authorName: authUser.name || 'School Admin'
              }
        );
        setIsModalOpen(true);
    };
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementToEdit || !announcementToEdit.title || !announcementToEdit.content) {
            showToast('error', 'Title and Content are required');
            return;
        }

        try {
            if (announcementToEdit.id) {
                await updateAnnouncement(announcementToEdit as Announcement);
                showToast('success', `✅ Announcement "${announcementToEdit.title}" updated successfully!`);
            } else {
                await addAnnouncement(announcementToEdit as Omit<Announcement, 'id'>);
                showToast('success', `✅ Announcement "${announcementToEdit.title}" created successfully!`);
            }
            setIsModalOpen(false);
            setAnnouncementToEdit(null);
        } catch (error) {
            console.error('Error saving announcement:', error);
            showToast('error', 'Failed to save announcement', error instanceof Error ? error.message : 'Please try again');
        }
    };

    const handleDeleteClick = (announcement: Announcement) => {
        setAnnouncementToDelete(announcement);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (announcementToDelete) {
            try {
                await deleteAnnouncement(announcementToDelete.id);
                showToast('success', `✅ Announcement "${announcementToDelete.title}" deleted successfully!`);
                setIsDeleteModalOpen(false);
                setAnnouncementToDelete(null);
            } catch (error) {
                console.error('Error deleting announcement:', error);
                showToast('error', 'Failed to delete announcement', error instanceof Error ? error.message : 'Please try again');
            }
        }
    };
    
    // Memoize teachers map for faster lookups
    const teachersMap = useMemo(() => {
        return new Map(teachers.map(t => [t.id, t.name]));
    }, [teachers]);

    const getAuthorName = useCallback((authorId?: string, authorName?: string) => {
        if (authorName) return authorName;
        if (!authorId) return 'School Admin';
        return teachersMap.get(authorId) || 'School Admin';
    }, [teachersMap]);
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            📢 Announcements
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            {session.type === 'staff' 
                                ? 'Manage and view all school announcements' 
                                : 'Stay updated with the latest school news'}
                        </p>
                    </div>
                    {canManage && (
                        <button 
                            onClick={() => handleOpenModal()} 
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Announcement
                        </button>
                    )}
                </div>
            </div>
            
            {/* Filters */}
            <div className="mb-6 space-y-4">
                {/* Search */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search announcements by title, content, or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white placeholder-slate-400 transition-all"
                    />
                </div>

                {/* Target Filter (Admin only) */}
                {canManage && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setTargetFilter(null)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                targetFilter === null
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                        >
                            All
                        </button>
                        {['all', 'staff', 'students', 'parents'].map((target) => (
                            <button
                                key={target}
                                onClick={() => setTargetFilter(target as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                                    targetFilter === target
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                }`}
                            >
                                {target}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    {sortedAnnouncements.length} {sortedAnnouncements.length === 1 ? 'announcement' : 'announcements'} found
                </p>
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
                {paginatedAnnouncements.map(announcement => (
                    <div 
                        key={announcement.id} 
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Title and badges */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-lg flex items-center justify-center shadow-md">
                                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                                {announcement.title}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getTargetBadge(announcement.target)}`}>
                                                    {announcement.target.charAt(0).toUpperCase() + announcement.target.slice(1)}
                                                </span>
                                                <span className="text-slate-400">•</span>
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {formatDate(announcement.date)}
                                                </div>
                                                <span className="text-slate-400">•</span>
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    {getAuthorName(announcement.authorId, announcement.authorName)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {announcement.content}
                                    </p>
                                </div>

                                {/* Action buttons */}
                                {canManage && (
                                    <div className="flex items-start gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => handleOpenModal(announcement)} 
                                            className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(announcement)} 
                                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {sortedAnnouncements.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            {debouncedSearchQuery || targetFilter ? 'No announcements found' : 'No announcements yet'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                            {debouncedSearchQuery || targetFilter 
                                ? 'Try adjusting your search or filter criteria' 
                                : canManage 
                                    ? 'Create your first announcement to get started' 
                                    : 'Check back later for updates'}
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, sortedAnnouncements.length)}</span> of{' '}
                                <span className="font-medium">{sortedAnnouncements.length}</span> announcements
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                currentPage === pageNum
                                                    ? 'z-10 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Create/Edit Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    setAnnouncementToEdit(null);
                }} 
                title={announcementToEdit?.id ? '✏️ Edit Announcement' : '➕ Create Announcement'}
            >
                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={announcementToEdit?.title ?? ''} 
                            onChange={e => setAnnouncementToEdit(p => ({...p, title: e.target.value}))} 
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white transition-all" 
                            placeholder="e.g., School Event Announcement"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Content <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            value={announcementToEdit?.content ?? ''} 
                            onChange={e => setAnnouncementToEdit(p => ({...p, content: e.target.value}))} 
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white transition-all resize-none" 
                            rows={6}
                            placeholder="Write your announcement here..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Target Audience <span className="text-red-500">*</span>
                            </label>
                            <select 
                                value={announcementToEdit?.target ?? 'all'} 
                                onChange={e => setAnnouncementToEdit(p => ({...p, target: e.target.value as any}))} 
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white transition-all"
                            >
                                <option value="all">All (Staff, Students & Parents)</option>
                                <option value="staff">Staff Only</option>
                                <option value="students">Students Only</option>
                                <option value="parents">Parents Only</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Date
                            </label>
                            <input 
                                type="date" 
                                value={announcementToEdit?.date ?? new Date().toISOString().split('T')[0]} 
                                onChange={e => setAnnouncementToEdit(p => ({...p, date: e.target.value}))} 
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button 
                            type="button" 
                            onClick={() => {
                                setIsModalOpen(false);
                                setAnnouncementToEdit(null);
                            }} 
                            className="px-5 py-2.5 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-5 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
                        >
                            {announcementToEdit?.id ? 'Update' : 'Create'} Announcement
                        </button>
                    </div>
                </form>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={isDeleteModalOpen} 
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setAnnouncementToDelete(null);
                }} 
                title="🗑️ Delete Announcement"
            >
                <div className="space-y-4">
                    <p className="text-slate-700 dark:text-slate-300">
                        Are you sure you want to delete the announcement{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                            "{announcementToDelete?.title}"
                        </span>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setAnnouncementToDelete(null);
                            }} 
                            className="px-5 py-2.5 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete} 
                            className="px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
                        >
                            Delete Announcement
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
                    <div className={`
                        rounded-lg shadow-lg p-4 max-w-md
                        ${toast.type === 'success' 
                            ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-500' 
                            : 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500'
                        }
                    `}>
                        <div className="flex items-start gap-3">
                            <div className={`
                                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                                ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
                            `}>
                                {toast.type === 'success' ? (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={`
                                    font-semibold text-sm
                                    ${toast.type === 'success' 
                                        ? 'text-green-800 dark:text-green-200' 
                                        : 'text-red-800 dark:text-red-200'
                                    }
                                `}>
                                    {toast.message}
                                </p>
                                {toast.details && (
                                    <p className={`
                                        text-xs mt-1
                                        ${toast.type === 'success' 
                                            ? 'text-green-700 dark:text-green-300' 
                                            : 'text-red-700 dark:text-red-300'
                                        }
                                    `}>
                                        {toast.details}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setToast({ show: false, type: 'success', message: '' })}
                                className={`
                                    flex-shrink-0 ml-2
                                    ${toast.type === 'success' 
                                        ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200' 
                                        : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
                                    }
                                `}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

AnnouncementsView.displayName = 'AnnouncementsView';

export default AnnouncementsView;

import React, { useState, useMemo } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { Announcement, AuthUser, StudentUser, ParentUser } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';

interface AnnouncementsViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ schoolData, session }) => {
    const { announcements, teachers, addAnnouncement, updateAnnouncement, deleteAnnouncement } = schoolData;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [announcementToEdit, setAnnouncementToEdit] = useState<Partial<Announcement> | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const authUser = session.user as AuthUser;
    const canManage = session.type === 'staff' && ['admin', 'principal'].includes(authUser.role);

    const relevantAnnouncements = useMemo(() => {
        let filtered = announcements;
        if (session.type !== 'staff') {
             filtered = announcements.filter(a => a.target === 'all' || a.target === session.type);
        }

        if (debouncedSearchQuery) {
            const lowerQuery = debouncedSearchQuery.toLowerCase();
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(lowerQuery) ||
                a.content.toLowerCase().includes(lowerQuery)
            );
        }

        return filtered;
    }, [announcements, session.type, debouncedSearchQuery]);

    const sortedAnnouncements = useMemo(() => 
        [...relevantAnnouncements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [relevantAnnouncements]);

    const handleOpenModal = (announcement: Announcement | null = null) => {
        if (!canManage) return;
        setAnnouncementToEdit(announcement 
            ? { ...announcement } 
            : { target: 'all', date: new Date().toISOString().split('T')[0], authorId: authUser.id }
        );
        setIsModalOpen(true);
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementToEdit || !announcementToEdit.title || !announcementToEdit.content) {
            alert("Title and Content are required.");
            return;
        }

        if (announcementToEdit.id) {
            updateAnnouncement(announcementToEdit as Announcement);
        } else {
            addAnnouncement(announcementToEdit as Omit<Announcement, 'id'>);
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (announcement: Announcement) => {
        setAnnouncementToDelete(announcement);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (announcementToDelete) {
            deleteAnnouncement(announcementToDelete.id);
            setIsDeleteModalOpen(false);
        }
    };
    
    const getAuthorName = (authorId: string) => {
        return teachers.find(t => t.id === authorId)?.name || 'School Admin';
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">School Announcements</h1>
                {canManage && (
                    <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                        New Announcement
                    </button>
                )}
            </div>
            
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                />
            </div>

            <div className="space-y-6">
                {sortedAnnouncements.map(announcement => (
                    <div key={announcement.id} className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{announcement.title}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                    Posted on {announcement.date} by {getAuthorName(announcement.authorId)} | For: <span className="capitalize font-semibold">{announcement.target}</span>
                                </p>
                            </div>
                            {canManage && (
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleOpenModal(announcement)} className="p-2 text-sky-600 hover:text-sky-800"><PencilIcon/></button>
                                    <button onClick={() => handleDeleteClick(announcement)} className="p-2 text-red-600 hover:text-red-800"><TrashIcon/></button>
                                </div>
                            )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{announcement.content}</p>
                    </div>
                ))}
                {sortedAnnouncements.length === 0 && (
                    <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                        <p className="text-slate-600 dark:text-slate-300">{debouncedSearchQuery ? 'No announcements match your search.' : 'No announcements found.'}</p>
                    </div>
                )}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={announcementToEdit?.id ? 'Edit Announcement' : 'Create Announcement'}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="font-semibold block mb-1">Title</label>
                        <input type="text" value={announcementToEdit?.title ?? ''} onChange={e => setAnnouncementToEdit(p => ({...p, title: e.target.value}))} className="w-full input-style" required/>
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">Content</label>
                        <textarea value={announcementToEdit?.content ?? ''} onChange={e => setAnnouncementToEdit(p => ({...p, content: e.target.value}))} className="w-full input-style" rows={6} required/>
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">Target Audience</label>
                        <select value={announcementToEdit?.target ?? 'all'} onChange={e => setAnnouncementToEdit(p => ({...p, target: e.target.value as any}))} className="w-full input-style">
                            <option value="all">All</option>
                            <option value="staff">Staff Only</option>
                            <option value="parents">Parents Only</option>
                            <option value="students">Students Only</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                <p>Are you sure you want to delete the announcement <span className="font-bold">"{announcementToDelete?.title}"</span>? This cannot be undone.</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={confirmDelete} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg">Delete</button>
                </div>
            </Modal>
             <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
        </div>
    );
};

export default AnnouncementsView;
/**
 * LessonPlanView - PostgreSQL-based Lesson Plan Management
 * 
 * Migrated to PostgreSQL: November 28, 2025
 * - Uses useLessonPlansPostgreSQL hook
 * - Uses useAssignmentsPostgreSQL for assignments
 * - Uses useSectionsPostgreSQL and useLearningAreasPostgreSQL for filters
 * - No Firestore dependencies
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { LessonPlan, AuthUser, StudentUser } from '../types';
import Modal from './Modal';
import AIGeneratorModal from './AIGeneratorModal';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon, CloseIcon, FunnelIcon, MagnifyingGlassIcon, CalendarIcon, ClipboardDocumentListIcon, CalendarDaysIcon, ClockIcon, ChartBarIcon, BookOpenIcon, SparklesIcon, CheckCircleIcon } from './icons';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import { useLessonPlansPostgreSQL } from '../src/hooks/useLessonPlansPostgreSQL';
import { useAssignmentsPostgreSQL } from '../src/hooks/useAssignmentsPostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useLearningAreasPostgreSQL } from '../src/hooks/useLearningAreasPostgreSQL';

// Extract SchoolContext hook for school ID
const useSchool = () => {
    const context = useSchoolContext();
    if (!context) {
        throw new Error('useSchool must be used within SchoolProvider');
    }
    return context;
};


interface LessonPlanViewProps {
    session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const LessonPlanView: React.FC<LessonPlanViewProps> = ({ session }) => {
    const { schoolId } = useSchool();
    
    // PostgreSQL hooks - they get schoolId from SchoolContext internally
    const { lessonPlans, loading: plansLoading, addLessonPlan, updateLessonPlan, deleteLessonPlan } = useLessonPlansPostgreSQL();
    const { sections, loading: sectionsLoading } = useSectionsPostgreSQL();
    const { learningAreas, loading: areasLoading } = useLearningAreasPostgreSQL();
    const { assignments, loading: assignmentsLoading } = useAssignmentsPostgreSQL();
    
    const loading = plansLoading || sectionsLoading || areasLoading || assignmentsLoading;
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedLearningAreaId, setSelectedLearningAreaId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [planToEdit, setPlanToEdit] = useState<Partial<LessonPlan> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    
    const authUser = session.user as AuthUser;
    const isStaff = ['admin', 'principal', 'registrar'].includes(authUser.role);
    
    // Only show sections for grade levels the teacher is assigned to
    const visibleSections = useMemo(() => {
        if (isStaff) return sections;
        
        const teacherAssignments = authUser.assignments || [];
        if (teacherAssignments.length === 0) {
            return [];
        }
        
        // Get unique grade levels this teacher is assigned to
        const assignedGradeLevels = new Set(teacherAssignments.map(a => a.gradeLevel));
        
        return sections.filter(s => assignedGradeLevels.has(s.gradeLevel));
    }, [sections, authUser, isStaff]);

    useEffect(() => {
        if (!selectedSectionId && visibleSections.length > 0) {
            setSelectedSectionId(visibleSections[0].id);
        }
    }, [visibleSections, selectedSectionId]);

    // Filter learning areas based on teacher assignments for the selected section's grade level
    const learningAreasForSection = useMemo(() => {
        if (!selectedSectionId) return [];
        if (isStaff) return learningAreas;
        
        const section = sections.find(s => s.id === selectedSectionId);
        if (!section) return [];
        
        const teacherAssignments = authUser.assignments || [];
        const learningAreaIds = teacherAssignments
            .filter(a => a.gradeLevel === section.gradeLevel)
            .map(a => a.learningAreaId);
        
        return learningAreas.filter(la => learningAreaIds.includes(la.id));
    }, [learningAreas, selectedSectionId, sections, authUser, isStaff]);
    
    useEffect(() => {
        if (selectedSectionId && !learningAreasForSection.some(la => la.id === selectedLearningAreaId)) {
            setSelectedLearningAreaId(learningAreasForSection[0]?.id || null);
        }
    }, [selectedSectionId, learningAreasForSection, selectedLearningAreaId]);
    
    // Filter lesson plans by section, learning area, and search query
    const filteredLessonPlans = useMemo(() => {
        if (!selectedSectionId || !selectedLearningAreaId) return [];
        
        let filtered = lessonPlans.filter((p: any) => 
            p.sectionId === selectedSectionId && p.learningAreaId === selectedLearningAreaId
        );
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((p: any) => 
                p.title?.toLowerCase().includes(query) ||
                p.objectives?.some((obj: string) => obj?.toLowerCase().includes(query)) ||
                p.activities?.some((act: string) => act?.toLowerCase().includes(query))
            );
        }
        
        return filtered;
    }, [lessonPlans, selectedSectionId, selectedLearningAreaId, searchQuery]);
    
    const plansByDate = useMemo(() => {
        const map = new Map<string, LessonPlan[]>();
        filteredLessonPlans.forEach((plan: any) => {
            const dateKey = plan.date;
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey)!.push(plan);
        });
        return map;
    }, [filteredLessonPlans]);
    
    // Calculate statistics
    const lessonPlanStats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];
        
        const nextWeekStart = new Date(thisWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekStartStr = nextWeekStart.toISOString().split('T')[0];
        
        let total = filteredLessonPlans.length;
        let thisWeek = 0;
        let nextWeek = 0;
        let thisMonth = 0;
        
        filteredLessonPlans.forEach((plan: any) => {
            if (plan.date >= thisWeekStartStr && plan.date < nextWeekStartStr) thisWeek++;
            if (plan.date >= nextWeekStartStr) {
                const planDate = new Date(plan.date);
                const weekEnd = new Date(nextWeekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);
                if (planDate < weekEnd) nextWeek++;
            }
            if (plan.date.startsWith(currentDate.toISOString().slice(0, 7))) thisMonth++;
        });
        
        return { total, thisWeek, nextWeek, thisMonth };
    }, [filteredLessonPlans, currentDate]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid: (Date | null)[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) grid.push(null);
        for (let i = 1; i <= daysInMonth; i++) grid.push(new Date(year, month, i));
        
        return grid;
    }, [currentDate]);

    const handleDateClick = (date: Date | null) => {
        if (!date) return;
        const dateStr = date.toISOString().split('T')[0];
        const existingPlans = plansByDate.get(dateStr);
        setSelectedDate(dateStr);
        setPlanToEdit(existingPlans?.[0] ? { ...existingPlans[0] } : { date: dateStr, sectionId: selectedSectionId, learningAreaId: selectedLearningAreaId, objectives: [''], activities: [''], materials: [''], assessment: [''], resources: [], assignmentIds: [] });
        setIsModalOpen(true);
    };
    
    const handleSavePlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!planToEdit || !planToEdit.title) {
            alert("Title is required."); return;
        }
        if (planToEdit.id) {
            updateLessonPlan(planToEdit as LessonPlan);
        } else {
            addLessonPlan(planToEdit as Omit<LessonPlan, 'id'>);
        }
        setIsModalOpen(false);
    };
    
    const handleDeletePlan = () => {
        if (planToEdit?.id) {
            deleteLessonPlan(planToEdit.id);
            setIsModalOpen(false);
        }
    };
    
    const handleFieldChange = (field: keyof LessonPlan, value: any) => {
        setPlanToEdit(prev => {
            const base: any = prev ?? { objectives: [''], activities: [''], materials: [''], assessment: [''] };
            return { ...base, [field]: value } as any;
        });
    };

    const handleListItemChange = (field: 'objectives' | 'activities' | 'materials' | 'assessment', index: number, value: string) => {
        setPlanToEdit(prev => {
            const curr = (prev ?? { objectives: [''], activities: [''], materials: [''], assessment: [''] }) as any;
            const items: string[] = Array.isArray(curr[field]) ? [...curr[field]] : [];
            items[index] = value;
            return { ...curr, [field]: items } as any;
        });
    };

    const addListItem = (field: 'objectives' | 'activities' | 'materials' | 'assessment') => {
        setPlanToEdit(prev => {
            const curr = (prev ?? { objectives: [''], activities: [''], materials: [''], assessment: [''] }) as any;
            const items: string[] = Array.isArray(curr[field]) ? [...curr[field], ''] : [''];
            return { ...curr, [field]: items } as any;
        });
    };

    const removeListItem = (field: 'objectives' | 'activities' | 'materials' | 'assessment', index: number) => {
        setPlanToEdit(prev => {
            const curr = (prev ?? { objectives: [], activities: [], materials: [], assessment: [] }) as any;
            const items: string[] = Array.isArray(curr[field]) ? curr[field].filter((_: any, i: number) => i !== index) : [];
            return { ...curr, [field]: items } as any;
        });
    };

        const availableAssignments = useMemo(() => {
        if (!planToEdit?.sectionId || !planToEdit.learningAreaId) return [];
        return assignments.filter(a => a.sectionId === planToEdit.sectionId && a.learningAreaId === planToEdit.learningAreaId);
    }, [assignments, planToEdit]);
    
        const renderPlanEditableList = (field: 'objectives' | 'activities' | 'materials' | 'assessment') => {
            const list = (planToEdit?.[field] || []) as string[];
            
            // Icon mapping for each section type
            const icons: Record<string, React.ReactNode> = {
                objectives: <ClipboardDocumentListIcon className="h-5 w-5" />,
                activities: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                materials: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
                assessment: <CheckCircleIcon className="h-5 w-5" />,
            };
            
            // Color schemes for each section
            const colorSchemes: Record<string, string> = {
                objectives: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800',
                activities: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800',
                materials: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800',
                assessment: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800',
            };
            
            const buttonColors: Record<string, string> = {
                objectives: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
                activities: 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300',
                materials: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
                assessment: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
            };
            
            return (
                <div className={`bg-gradient-to-r ${colorSchemes[field]} p-5 rounded-xl border-2`}>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        {icons[field]}
                        <span className="capitalize">{field}</span>
                        <span className="ml-auto text-xs bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full">{list.length} items</span>
                    </label>
                    <div className="space-y-3">
                        {list.map((item, index) => (
                            <div key={`${field}-${index}`} className="relative group">
                                <div className="absolute left-3 top-3 text-xs font-bold text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full z-10">
                                    {index + 1}
                                </div>
                                <textarea
                                    value={item ?? ''}
                                    onChange={e => handleListItemChange(field, index, e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                    rows={2}
                                    placeholder={`Enter ${field.slice(0, -1)} ${index + 1}...`}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeListItem(field, index)}
                                    className="absolute right-3 top-3 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-white dark:bg-slate-700 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title="Remove item"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => addListItem(field)}
                        className={`mt-3 text-sm font-semibold flex items-center gap-1 ${buttonColors[field]} transition-colors`}
                    >
                        <PlusIcon /> Add {field.slice(0, -1)}
                    </button>
                </div>
            );
        };

    // Empty state components
    const EmptyStateSelectFilters = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-full mb-4">
                <FunnelIcon />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Select Class and Learning Area</h3>
            <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">Choose a class and learning area from the filters above to view and manage lesson plans.</p>
        </div>
    );

    const EmptyStateNoPlans = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-6 rounded-full mb-4">
                <ClipboardDocumentListIcon />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Lesson Plans Yet</h3>
            <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-4">
                Get started by creating your first lesson plan for this class and subject.
            </p>
            <button
                onClick={() => setIsAIGeneratorOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
                <SparklesIcon className="h-5 w-5"/> Generate with AI
            </button>
        </div>
    );

    const EmptyStateNoResults = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-6 rounded-full mb-4">
                <MagnifyingGlassIcon />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Results Found</h3>
            <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
                No lesson plans match your search. Try different keywords or clear your search.
            </p>
            <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                Clear Search
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Lesson Plans</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Plan, organize, and track your lessons with AI assistance</p>
                </div>
            </div>

            {/* Statistics Cards */}
            {selectedSectionId && selectedLearningAreaId && filteredLessonPlans.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-slate-800 dark:text-white">{lessonPlanStats.total}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Total Plans</div>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                                <ClipboardDocumentListIcon />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{lessonPlanStats.thisWeek}</div>
                                <div className="text-xs text-green-600 dark:text-green-500 font-medium mt-1">This Week</div>
                            </div>
                            <div className="bg-green-100 dark:bg-green-800/30 p-3 rounded-lg">
                                <CalendarDaysIcon />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{lessonPlanStats.nextWeek}</div>
                                <div className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-1">Next Week</div>
                            </div>
                            <div className="bg-amber-100 dark:bg-amber-800/30 p-3 rounded-lg">
                                <ClockIcon />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{lessonPlanStats.thisMonth}</div>
                                <div className="text-xs text-purple-600 dark:text-purple-500 font-medium mt-1">This Month</div>
                            </div>
                            <div className="bg-purple-100 dark:bg-purple-800/30 p-3 rounded-lg">
                                <ChartBarIcon />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Search Bar */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Class</label>
                        <select
                            value={selectedSectionId ?? ''}
                            onChange={e => setSelectedSectionId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            aria-label="Select class">
                            <option value="">Select a class...</option>
                            {visibleSections.map((s: any) => (
                                <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Learning Area</label>
                        <select
                            value={selectedLearningAreaId ?? ''}
                            onChange={e => setSelectedLearningAreaId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            aria-label="Select learning area"
                            disabled={!selectedSectionId || learningAreasForSection.length === 0}>
                            <option value="">Select a learning area...</option>
                            {learningAreasForSection.map((la: any) => (
                                <option key={la.id} value={la.id}>{la.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Search</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search lesson plans..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                aria-label="Search lesson plans"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAIGeneratorOpen(true)}
                            disabled={!selectedSectionId || !selectedLearningAreaId}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                            title={!selectedSectionId || !selectedLearningAreaId ? "Select a class and learning area first" : "Generate lesson plan with AI"}>
                            <SparklesIcon className="h-5 w-5"/> AI Generate
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                                viewMode === 'calendar'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                            aria-label="Calendar view">
                            <CalendarIcon />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                                viewMode === 'list'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                            aria-label="List view">
                            <ClipboardDocumentListIcon />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {!selectedSectionId || !selectedLearningAreaId ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                    <EmptyStateSelectFilters />
                </div>
            ) : viewMode === 'calendar' ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            aria-label="Previous month">
                            <ChevronLeftIcon/>
                        </button>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            aria-label="Next month">
                            <ChevronRightIcon/>
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="font-bold text-slate-700 dark:text-slate-300 p-3 text-sm">{day}</div>
                        ))}
                        {calendarGrid.map((date, index) => {
                            const dateStr = date?.toISOString().split('T')[0];
                            const plans = dateStr ? plansByDate.get(dateStr) : undefined;
                            const today = new Date().toISOString().split('T')[0];
                            const isToday = dateStr === today;
                            
                            return (
                                <div
                                    key={index}
                                    onClick={() => handleDateClick(date)}
                                    className={`p-3 border rounded-lg min-h-[120px] transition-all ${
                                        date
                                            ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md bg-white dark:bg-slate-700/50'
                                            : 'bg-slate-50 dark:bg-slate-800/30 cursor-default'
                                    } ${isToday ? 'border-2 border-indigo-500 shadow-md' : 'border-slate-200 dark:border-slate-600'}`}>
                                    <div className={`font-semibold mb-2 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {date?.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                        {plans?.slice(0, 2).map((plan: LessonPlan) => (
                                            <div key={plan.id} className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-800 dark:text-indigo-200 p-1.5 rounded text-xs font-medium truncate border border-indigo-200 dark:border-indigo-700">
                                                {plan.title}
                                            </div>
                                        ))}
                                        {plans && plans.length > 2 && (
                                            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">+{plans.length - 2} more</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Empty state message within calendar */}
                    {filteredLessonPlans.length === 0 && !searchQuery.trim() && (
                        <div className="mt-8 text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                                <ClipboardDocumentListIcon />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Lesson Plans Yet</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">Click on any date to create your first lesson plan.</p>
                            <button
                                onClick={() => setIsAIGeneratorOpen(true)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg inline-flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
                                <SparklesIcon className="h-5 w-5"/> Generate with AI
                            </button>
                        </div>
                    )}
                    
                    {filteredLessonPlans.length === 0 && searchQuery.trim() && (
                        <div className="mt-8 text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                                <MagnifyingGlassIcon />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Results Found</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">No lesson plans match "{searchQuery}"</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                    {filteredLessonPlans.length === 0 && !searchQuery.trim() ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                                <ClipboardDocumentListIcon />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Lesson Plans Yet</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">Get started by creating your first lesson plan.</p>
                            <button
                                onClick={() => setIsAIGeneratorOpen(true)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg inline-flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
                                <SparklesIcon className="h-5 w-5"/> Generate with AI
                            </button>
                        </div>
                    ) : filteredLessonPlans.length === 0 && searchQuery.trim() ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                                <MagnifyingGlassIcon />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Results Found</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">No lesson plans match "{searchQuery}"</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                                Clear Search
                            </button>
                        </div>
                    ) : (
                    <div className="space-y-3">
                        {filteredLessonPlans.map((plan: any) => {
                            const planDate = new Date(plan.date);
                            const today = new Date();
                            const isPast = planDate < new Date(today.setHours(0, 0, 0, 0));
                            const isToday = plan.date === new Date().toISOString().split('T')[0];
                            
                            return (
                                <div
                                    key={plan.id}
                                    onClick={() => {
                                        setSelectedDate(plan.date);
                                        setPlanToEdit({ ...plan });
                                        setIsModalOpen(true);
                                    }}
                                    className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-white to-slate-50 dark:from-slate-700 dark:to-slate-800">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{plan.title}</h3>
                                                {isToday && (
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full border border-green-300 dark:border-green-700">
                                                        TODAY
                                                    </span>
                                                )}
                                                {isPast && !isToday && (
                                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold px-2 py-1 rounded-full">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <CalendarDaysIcon />
                                                    <span>{planDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <ClipboardDocumentListIcon />
                                                    <span>{plan.objectives?.length || 0} objectives</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <BookOpenIcon />
                                                    <span>{plan.activities?.length || 0} activities</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRightIcon />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="" size="3xl">
                {planToEdit && (
                    <div className="relative">
                        {/* Gradient Header */}
                        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 -mx-6 -mt-6 px-6 py-8 rounded-t-xl">
                            <div className="flex items-center gap-3 text-white">
                                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                    {planToEdit.id ? (
                                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{planToEdit.id ? 'Edit Lesson Plan' : 'Create New Lesson Plan'}</h2>
                                    <p className="text-blue-100 text-sm mt-1">
                                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <form onSubmit={handleSavePlan} className="space-y-6 max-h-[65vh] overflow-y-auto px-1 py-6">
                            {/* Lesson Title */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    <BookOpenIcon />
                                    Lesson Title
                                </label>
                                <input
                                    type="text"
                                    value={planToEdit.title ?? ''}
                                    onChange={e => handleFieldChange('title', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="Enter a descriptive lesson title..."
                                    required
                                />
                            </div>

                            {/* Objectives */}
                            {renderPlanEditableList('objectives')}

                            {/* Activities */}
                            {renderPlanEditableList('activities')}

                            {/* Materials */}
                            {renderPlanEditableList('materials')}

                            {/* Assessment */}
                            {renderPlanEditableList('assessment')}

                            {/* Assignments */}
                            <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    Linked Assignments
                                    <span className="ml-auto text-xs bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full">
                                        {(planToEdit.assignmentIds ?? []).length} selected
                                    </span>
                                </label>
                                <select
                                    multiple
                                    value={planToEdit.assignmentIds ?? []}
                                    onChange={e => handleFieldChange('assignmentIds', Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))}
                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[120px]"
                                    title="Select assignments"
                                >
                                    {availableAssignments.map((a: { id: string; title: string }) => (
                                        <option key={a.id} value={a.id} className="py-2">
                                            {a.title}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Hold Ctrl/Cmd to select multiple assignments
                                </p>
                            </div>
                        </form>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-700 -mx-6 px-6 -mb-6 pb-6 bg-slate-50 dark:bg-slate-800/50">
                            {planToEdit.id && (
                                <button
                                    type="button"
                                    onClick={handleDeletePlan}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                >
                                    <TrashIcon /> Delete Lesson Plan
                                </button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-6 rounded-lg transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSavePlan}
                                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
                                >
                                    <CheckCircleIcon />
                                    {planToEdit.id ? 'Save Changes' : 'Create Lesson Plan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
            
            {isAIGeneratorOpen && (
                <AIGeneratorModal 
                    isOpen={isAIGeneratorOpen} 
                    onClose={() => setIsAIGeneratorOpen(false)} 
                    selectedSectionId={selectedSectionId} 
                    selectedLearningAreaId={selectedLearningAreaId}
                    sections={sections}
                    addLessonPlan={addLessonPlan}
                />
            )}

            <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
        </div>
    );
};

export default LessonPlanView;
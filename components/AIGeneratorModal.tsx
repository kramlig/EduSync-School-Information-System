/**
 * AIGeneratorModal - AI-Powered Lesson Plan Generator
 * 
 * Uses Gemini API to generate comprehensive lesson plans
 * Extracted from LessonPlanView for better code organization
 */

import React, { useState } from 'react';
import type { LessonPlan } from '../types';
import { generateLessonPlan, GeneratedLessonPlan } from '../services/geminiService';
import Modal from './Modal';
import Spinner from './Spinner';
import { 
    SparklesIcon, 
    ClipboardDocumentListIcon, 
    CalendarDaysIcon, 
    BookOpenIcon, 
    CheckCircleIcon 
} from './icons';

interface AIGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSectionId: string | null;
    selectedLearningAreaId: string | null;
    sections: Array<{ id: string; gradeLevel: number }>;
    addLessonPlan: (lessonPlan: Omit<LessonPlan, 'id' | 'schoolId'>) => Promise<void>;
}

const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ 
    isOpen, 
    onClose, 
    selectedSectionId, 
    selectedLearningAreaId, 
    sections, 
    addLessonPlan 
}) => {
    const [topic, setTopic] = useState('');
    const [objectives, setObjectives] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedLessonPlan | null>(null);

    const handleGenerate = async () => {
        if (!topic || !objectives) {
            setError('Topic and Objectives are required.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedPlan(null);

        try {
            const gradeLevel = sections.find(s => s.id === selectedSectionId)?.gradeLevel;
            if (!gradeLevel) {
                throw new Error("Could not determine grade level.");
            }
            const plan = await generateLessonPlan(topic, gradeLevel, objectives);
            setGeneratedPlan(plan);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "Failed to generate lesson plan.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePlan = () => {
        if (!generatedPlan) return;
        
        const newPlan: Omit<LessonPlan, 'id' | 'schoolId'> = {
            sectionId: selectedSectionId!,
            learningAreaId: selectedLearningAreaId!,
            date: date,
            title: generatedPlan.title,
            objectives: generatedPlan.objectives,
            activities: generatedPlan.activities,
            materials: generatedPlan.materials,
            assessment: generatedPlan.assessment,
            resources: [],
            assignmentIds: [],
        };
        addLessonPlan(newPlan);
        onClose();
    };

    const handleItemChange = (field: keyof GeneratedLessonPlan, index: number, value: string) => {
        setGeneratedPlan(prev => {
            if (!prev) return prev;
            const current = Array.isArray(prev[field]) ? (prev[field] as string[]) : [];
            const next = [...current];
            next[index] = value;
            return { ...prev, [field]: next } as GeneratedLessonPlan;
        });
    };

    const renderEditableList = (field: keyof GeneratedLessonPlan) => {
        if (!generatedPlan) return null;

        const list = (generatedPlan[field] as string[]) || [];
        
        const icons: Record<string, React.ReactNode> = {
            objectives: <ClipboardDocumentListIcon />,
            activities: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>,
            materials: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
            assessment: <CheckCircleIcon className="h-5 w-5" />,
        };
        
        const colorSchemes: Record<string, string> = {
            objectives: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800',
            activities: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800',
            materials: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800',
            assessment: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800',
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
                        <div key={`${String(field)}-${index}`} className="relative group">
                            <div className="absolute left-3 top-3 text-xs font-bold text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full z-10">
                                {index + 1}
                            </div>
                            <textarea
                                value={item ?? ''}
                                onChange={(e) => handleItemChange(field, index, e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                rows={2}
                                placeholder={`Enter ${field.slice(0, -1)} ${index + 1}...`}
                                title={`Edit ${field.slice(0, -1)} ${index + 1}`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="3xl">
            {!generatedPlan ? (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 -mx-6 -mt-6 px-6 py-8 rounded-t-xl">
                        <div className="flex items-center gap-3 text-white">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <SparklesIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">AI Lesson Plan Generator</h2>
                                <p className="text-indigo-100 text-sm mt-1">Let AI create a comprehensive lesson plan tailored to your needs</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="space-y-6 px-2">
                        {/* Date Field */}
                        <div className="relative">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                <CalendarDaysIcon />
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                title="Select lesson plan date"
                                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                required
                            />
                        </div>

                        {/* Topic Field */}
                        <div className="relative">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                <BookOpenIcon />
                                Lesson Topic
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., The Solar System, Photosynthesis, Philippine Heroes..."
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                required
                            />
                        </div>

                        {/* Objectives Field */}
                        <div className="relative">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                <ClipboardDocumentListIcon />
                                Learning Objectives
                            </label>
                            <textarea
                                placeholder="Describe what students should learn. e.g., 'Students will be able to identify the eight planets in order from the sun and describe key characteristics of each planet.'"
                                value={objectives}
                                onChange={e => setObjectives(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                rows={4}
                                required
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                                {objectives.length} characters
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 p-6 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <Spinner />
                                    <div>
                                        <p className="font-semibold text-indigo-900 dark:text-indigo-200">Generating your lesson plan...</p>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">AI is crafting objectives, activities, materials, and assessments</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !topic || !objectives}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all">
                            {isLoading ? (
                                <>
                                    <Spinner />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-5 w-5"/>
                                    <span>Generate Plan</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Success Header */}
                    <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 -mx-6 -mt-6 px-6 py-8 rounded-t-xl">
                        <div className="flex items-center gap-3 text-white">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <CheckCircleIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Lesson Plan Generated!</h2>
                                <p className="text-green-100 text-sm mt-1">Review and customize your AI-generated lesson plan below</p>
                            </div>
                        </div>
                    </div>

                    {/* Editable Content */}
                    <div className="space-y-6 px-2 max-h-[60vh] overflow-y-auto">
                        {/* Title */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                Lesson Title
                            </label>
                            <input
                                type="text"
                                value={generatedPlan.title}
                                onChange={e => setGeneratedPlan(p => p ? {...p, title: e.target.value} : null)}
                                title="Edit lesson plan title"
                                placeholder="Enter lesson title"
                                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold text-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>

                        {renderEditableList('objectives')}
                        {renderEditableList('activities')}
                        {renderEditableList('materials')}
                        {renderEditableList('assessment')}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setGeneratedPlan(null)}
                            className="px-6 py-2.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Form
                        </button>
                        <button
                            onClick={handleCreatePlan}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>Create Lesson Plan</span>
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AIGeneratorModal;

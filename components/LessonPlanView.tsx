import React, { useState, useMemo, useEffect } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { LessonPlan, Section, LearningArea, Assignment, AuthUser, StudentUser, LessonResource } from '../types';
import { generateLessonPlan, GeneratedLessonPlan } from '../services/geminiService';
import Modal from './Modal';
import Spinner from './Spinner';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon, CloseIcon, SparklesIcon } from './icons';

const AIGeneratorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    schoolData: SchoolDataHook;
    selectedSectionId: string | null;
    selectedLearningAreaId: string | null;
}> = ({ isOpen, onClose, schoolData, selectedSectionId, selectedLearningAreaId }) => {
    const { addLessonPlan, sections } = schoolData;
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
        } catch (e: any) {
            setError(e.message || "Failed to generate lesson plan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePlan = () => {
        if (!generatedPlan) return;
        
        const newPlan: Omit<LessonPlan, 'id'> = {
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
    
    const renderEditableList = (field: keyof GeneratedLessonPlan) => {
        if (!generatedPlan) return null;
        const list = generatedPlan[field] as string[];
        
        const handleItemChange = (index: number, value: string) => {
            const newList = [...list];
            newList[index] = value;
            setGeneratedPlan({ ...generatedPlan, [field]: newList });
        };

        return (
            <div>
                <label className="font-bold capitalize">{field}</label>
                {list.map((item, index) => (
                    <textarea
                        key={index}
                        value={item}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="w-full input-style mb-2"
                        rows={2}
                    />
                ))}
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Lesson Plan Generator" size="3xl">
            {!generatedPlan ? (
                <div className="space-y-4">
                    <div><label className="font-bold">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full input-style" required /></div>
                    <div><label className="font-bold">Lesson Topic</label><input type="text" placeholder="e.g., The Solar System" value={topic} onChange={e => setTopic(e.target.value)} className="w-full input-style" required /></div>
                    <div><label className="font-bold">Learning Objectives</label><textarea placeholder="e.g., Students will be able to name the planets in order." value={objectives} onChange={e => setObjectives(e.target.value)} className="w-full input-style" rows={3} required /></div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end pt-2">
                        <button onClick={handleGenerate} disabled={isLoading} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center disabled:bg-slate-400">
                            {isLoading ? <><Spinner /> Generating...</> : <><SparklesIcon/> Generate Plan</>}
                        </button>
                    </div>
                </div>
            ) : (
                 <div className="space-y-4">
                    <div><label className="font-bold">Title</label><input type="text" value={generatedPlan.title} onChange={e => setGeneratedPlan(p => p ? {...p, title: e.target.value} : null)} className="w-full input-style" /></div>
                    {renderEditableList('objectives')}
                    {renderEditableList('activities')}
                    {renderEditableList('materials')}
                    {renderEditableList('assessment')}
                    <div className="flex justify-between items-center pt-4">
                        <button type="button" onClick={() => setGeneratedPlan(null)} className="font-semibold text-slate-600 hover:text-slate-800">« Back</button>
                        <button onClick={handleCreatePlan} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Create Lesson Plan</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};


const LessonPlanView: React.FC<{ schoolData: SchoolDataHook, session: { user: AuthUser | StudentUser, type: 'staff' | 'student' } }> = ({ schoolData, session }) => {
    const {
        lessonPlans, sections, learningAreas, assignments,
        addLessonPlan, updateLessonPlan, deleteLessonPlan
    } = schoolData;
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedLearningAreaId, setSelectedLearningAreaId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [planToEdit, setPlanToEdit] = useState<Partial<LessonPlan> | null>(null);
    
    const authUser = session.user as AuthUser;
    
    const visibleSections = useMemo(() => {
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return sections;
        const teacherAdviserSectionId = sections.find(s => s.adviserId === authUser.id)?.id;
        const assignedLearningAreaIds = new Set(authUser.assignments?.map(a => a.learningAreaId));
        return sections.filter(s => s.adviserId === authUser.id || assignedLearningAreaIds.size > 0);
    }, [sections, authUser]);

    useEffect(() => {
        if (!selectedSectionId && visibleSections.length > 0) {
            setSelectedSectionId(visibleSections[0].id);
        }
    }, [visibleSections, selectedSectionId]);

    const learningAreasForSection = useMemo(() => {
        if (!selectedSectionId) return [];
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return learningAreas;
        
        const section = sections.find(s => s.id === selectedSectionId);
        if (!section) return [];
        
        const teacherAssignments = authUser.assignments?.filter(a => a.gradeLevel === section.gradeLevel).map(a => a.learningAreaId) || [];
        
        return learningAreas.filter(la => teacherAssignments.includes(la.id));
    }, [learningAreas, selectedSectionId, sections, authUser]);
    
    useEffect(() => {
        if (selectedSectionId && !learningAreasForSection.some(la => la.id === selectedLearningAreaId)) {
            setSelectedLearningAreaId(learningAreasForSection[0]?.id || null);
        }
    }, [selectedSectionId, learningAreasForSection, selectedLearningAreaId]);
    
    const plansByDate = useMemo(() => {
        if (!selectedSectionId || !selectedLearningAreaId) return new Map();
        const map = new Map<string, LessonPlan[]>();
        lessonPlans
            .filter(p => p.sectionId === selectedSectionId && p.learningAreaId === selectedLearningAreaId)
            .forEach(plan => {
                const dateKey = plan.date;
                if (!map.has(dateKey)) map.set(dateKey, []);
                map.get(dateKey)!.push(plan);
            });
        return map;
    }, [lessonPlans, selectedSectionId, selectedLearningAreaId]);

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
        setPlanToEdit(p => ({ ...p, [field]: value }));
    };

    const handleListItemChange = (field: 'objectives' | 'activities' | 'materials' | 'assessment', index: number, value: string) => {
        const items = [...(planToEdit?.[field] || [])];
        items[index] = value;
        handleFieldChange(field, items);
    };

    const addListItem = (field: 'objectives' | 'activities' | 'materials' | 'assessment') => {
        const items = [...(planToEdit?.[field] || []), ''];
        handleFieldChange(field, items);
    };

    const removeListItem = (field: 'objectives' | 'activities' | 'materials' | 'assessment', index: number) => {
        const items = (planToEdit?.[field] || []).filter((_, i) => i !== index);
        handleFieldChange(field, items);
    };

    const availableAssignments = useMemo(() => {
        if (!planToEdit?.sectionId || !planToEdit.learningAreaId) return [];
        return assignments.filter(a => a.sectionId === planToEdit.sectionId && a.learningAreaId === planToEdit.learningAreaId);
    }, [assignments, planToEdit]);
    
    const EditableList: React.FC<{field: 'objectives' | 'activities' | 'materials' | 'assessment'}> = ({ field }) => (
      <div>
        <label className="font-bold capitalize">{field}</label>
        {planToEdit?.[field]?.map((item, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
                <textarea value={item} onChange={e => handleListItemChange(field, index, e.target.value)} className="w-full input-style" rows={2}/>
                <button type="button" onClick={() => removeListItem(field, index)} className="text-red-500"><CloseIcon/></button>
            </div>
        ))}
        <button type="button" onClick={() => addListItem(field)} className="text-sm text-indigo-600 font-semibold flex items-center"><PlusIcon/> Add {field.slice(0, -1)}</button>
      </div>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Lesson Plans</h1>

            <div className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label className="font-semibold mr-2">Class:</label>
                        <select value={selectedSectionId ?? ''} onChange={e => setSelectedSectionId(e.target.value)} className="input-style">
                            {visibleSections.map(s => <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold mr-2">Learning Area:</label>
                        <select value={selectedLearningAreaId ?? ''} onChange={e => setSelectedLearningAreaId(e.target.value)} className="input-style">
                            {learningAreasForSection.map(la => <option key={la.id} value={la.id}>{la.name}</option>)}
                        </select>
                    </div>
                </div>
                <button onClick={() => setIsAIGeneratorOpen(true)} disabled={!selectedSectionId || !selectedLearningAreaId} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center disabled:bg-slate-400">
                    <SparklesIcon className="mr-2"/> Generate with AI
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><ChevronLeftIcon/></button>
                    <h2 className="text-xl font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><ChevronRightIcon/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="font-semibold p-2">{day}</div>)}
                    {calendarGrid.map((date, index) => {
                        const dateStr = date?.toISOString().split('T')[0];
                        const plans = dateStr ? plansByDate.get(dateStr) : undefined;
                        return (
                            <div key={index} onClick={() => handleDateClick(date)} className={`p-2 border rounded-md min-h-[100px] ${date ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                <div className="font-bold">{date?.getDate()}</div>
                                <div className="text-xs space-y-1 mt-1">
                                    {plans?.map(plan => (
                                        <div key={plan.id} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 p-1 rounded truncate">{plan.title}</div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={planToEdit?.id ? 'Edit Lesson Plan' : 'Create Lesson Plan'} size="3xl">
                {planToEdit && (
                    <form onSubmit={handleSavePlan} className="space-y-4">
                        <p className="font-semibold text-lg">{new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <div><label className="font-bold">Lesson Title</label><input type="text" value={planToEdit.title ?? ''} onChange={e => handleFieldChange('title', e.target.value)} className="w-full input-style" required /></div>
                        <EditableList field="objectives"/>
                        <EditableList field="activities"/>
                        <EditableList field="materials"/>
                        <EditableList field="assessment"/>
                        <div><label className="font-bold">Assignments</label><select multiple value={planToEdit.assignmentIds} onChange={e => handleFieldChange('assignmentIds', Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))} className="w-full input-style h-24">{availableAssignments.map(a => (<option key={a.id} value={a.id}>{a.title}</option>))}</select></div>
                        <div className="flex justify-between items-center pt-4">
                            {planToEdit.id && <button type="button" onClick={handleDeletePlan} className="text-red-600 font-semibold flex items-center"><TrashIcon/> Delete</button>}
                            <div className="space-x-2 ml-auto">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Save</button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>
            
            {isAIGeneratorOpen && <AIGeneratorModal isOpen={isAIGeneratorOpen} onClose={() => setIsAIGeneratorOpen(false)} schoolData={schoolData} selectedSectionId={selectedSectionId} selectedLearningAreaId={selectedLearningAreaId}/>}

            <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
        </div>
    );
};

export default LessonPlanView;
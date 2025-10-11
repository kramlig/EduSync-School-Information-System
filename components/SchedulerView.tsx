import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { AuthUser, StudentUser, ClassSchedule, Section, ParentUser } from '../types';
import Modal from './Modal';
import { TrashIcon } from './icons';

// --- UTILITY FUNCTIONS ---
const getScheduleColor = (schedule: ClassSchedule) => {
  if (schedule.type === 'extracurricular') {
    return 'bg-slate-200 border-slate-400 text-slate-800 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-200';
  }
  const id = schedule.learningAreaId || schedule.id;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-red-200 border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200',
    'bg-sky-200 border-sky-400 text-sky-800 dark:bg-sky-900/50 dark:border-sky-700 dark:text-sky-200',
    'bg-emerald-200 border-emerald-400 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-200',
    'bg-amber-200 border-amber-400 text-amber-800 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-200',
    'bg-violet-200 border-violet-400 text-violet-800 dark:bg-violet-900/50 dark:border-violet-700 dark:text-violet-200',
    'bg-rose-200 border-rose-400 text-rose-800 dark:bg-rose-900/50 dark:border-rose-700 dark:text-rose-200',
    'bg-teal-200 border-teal-400 text-teal-800 dark:bg-teal-900/50 dark:border-teal-700 dark:text-teal-200',
    'bg-fuchsia-200 border-fuchsia-400 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:border-fuchsia-700 dark:text-fuchsia-200',
  ];
  return colors[Math.abs(hash % colors.length)];
};

const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const START_HOUR = 7;
const END_HOUR = 17;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const SchedulerView: React.FC<{ schoolData: SchoolDataHook; session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' }; forceStudentId?: string; }> = ({ schoolData, session, forceStudentId }) => {
    const { classSchedules, sections, teachers, learningAreas, students, addSchedule, updateSchedule, deleteSchedule } = schoolData;
    const isStudentView = session.type === 'student';
    const isParentView = session.type === 'parent';
    const isReadOnly = isStudentView || isParentView || (session.user as AuthUser).role === 'principal';

    const getInitialSectionId = () => {
        if (isStudentView) return (session.user as StudentUser).sectionId;
        if (isParentView) return students.find(s => s.id === forceStudentId)?.sectionId;
        return sections[0]?.id || null;
    };

    const [viewType, setViewType] = useState<'section' | 'teacher'>('section');
    const [selectedId, setSelectedId] = useState<string | null>(getInitialSectionId());
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<Partial<ClassSchedule> & { isEditing?: boolean }>({});
    const [modalError, setModalError] = useState<string | null>(null);

    const timeSlots = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => `${String(i + START_HOUR).padStart(2, '0')}:00`);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // --- Drag and Resize State ---
    const gridRef = useRef<HTMLDivElement>(null);
    const [activeInteraction, setActiveInteraction] = useState<{ type: 'drag' | 'resize'; schedule: ClassSchedule; } | null>(null);
    const [indicator, setIndicator] = useState<{ top: number; left: number; width: number; height: number; day: string; startTime: string; endTime: string; } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        if(notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const filteredSchedules = useMemo(() => {
        if (!selectedId) return [];
        if (viewType === 'teacher') {
            return classSchedules.filter(s => s.teacherId === selectedId);
        }
        const selectedSection = sections.find(s => s.id === selectedId);
        if (!selectedSection) return [];
        
        return classSchedules.filter(s => {
            if (s.scope === 'all') return true;
            if (s.scope === 'gradeLevel' && s.gradeLevel === selectedSection.gradeLevel) return true;
            if (s.scope === 'section' && s.sectionId === selectedId) return true;
            return false;
        });
    }, [classSchedules, selectedId, viewType, sections]);
    
    // --- Interaction Handlers ---
    const handleInteractionStart = (e: React.MouseEvent, type: 'drag' | 'resize', schedule: ClassSchedule) => {
        if (isReadOnly) return;
        e.preventDefault();
        e.stopPropagation();
        setActiveInteraction({ type, schedule });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!activeInteraction || !gridRef.current) return;
            e.preventDefault();

            const gridRect = gridRef.current.getBoundingClientRect();
            const y = e.clientY - gridRect.top;
            const x = e.clientX - gridRect.left;

            // Calculate day
            const dayIndex = Math.floor(x / (gridRect.width / days.length));
            const day = days[dayIndex] || days[0];

            // Calculate time
            const totalMinutesInView = TOTAL_HOURS * 60;
            const minutesFromTop = (y / gridRect.height) * totalMinutesInView;
            
            const originalDuration = timeToMinutes(activeInteraction.schedule.endTime) - timeToMinutes(activeInteraction.schedule.startTime);

            if (activeInteraction.type === 'drag') {
                const snappedMinutes = START_HOUR * 60 + Math.round(minutesFromTop / 15) * 15;
                const newStartTime = minutesToTime(snappedMinutes);
                const newEndTime = minutesToTime(snappedMinutes + originalDuration);
                const left = (dayIndex / days.length) * 100;
                const top = (snappedMinutes - (START_HOUR * 60)) / totalMinutesInView * 100;

                setIndicator({
                    day, startTime: newStartTime, endTime: newEndTime,
                    top, left, width: 100 / days.length, height: (originalDuration / totalMinutesInView) * 100
                });

            } else { // Resizing
                const startTimeMinutes = timeToMinutes(activeInteraction.schedule.startTime);
                const snappedEndTimeMinutes = START_HOUR * 60 + Math.round(minutesFromTop / 15) * 15;
                const newDuration = Math.max(15, snappedEndTimeMinutes - startTimeMinutes); // Min duration 15 mins
                const newEndTime = minutesToTime(startTimeMinutes + newDuration);
                
                const top = (startTimeMinutes - (START_HOUR * 60)) / totalMinutesInView * 100;
                const left = (days.indexOf(activeInteraction.schedule.dayOfWeek) / days.length) * 100;
                
                setIndicator({
                    day: activeInteraction.schedule.dayOfWeek, startTime: activeInteraction.schedule.startTime, endTime: newEndTime,
                    top, left, width: 100 / days.length, height: (newDuration / totalMinutesInView) * 100
                });
            }
        };

        const handleMouseUp = async () => {
            if (!activeInteraction || !indicator) {
                setActiveInteraction(null);
                setIndicator(null);
                return;
            }
            
            const updatedSchedule = {
                ...activeInteraction.schedule,
                dayOfWeek: indicator.day as ClassSchedule['dayOfWeek'],
                startTime: indicator.startTime,
                endTime: indicator.endTime,
            };

            const result = updateSchedule(updatedSchedule);
            if (!result.success) {
                setNotification(result.message || 'Failed to update schedule.');
            }
            
            setActiveInteraction(null);
            setIndicator(null);
        };

        if (activeInteraction) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [activeInteraction, indicator, updateSchedule]);
    
    // --- Modal Logic ---
    const handleCellClick = (day: string, time: string) => {
        if (isReadOnly) return;
        setModalError(null);
        const startTime = time;
        const endTime = `${String(Number(time.split(':')[0]) + 1).padStart(2, '0')}:00`;
        const initialData: Partial<ClassSchedule> = {
            dayOfWeek: day as ClassSchedule['dayOfWeek'],
            startTime,
            endTime,
            type: 'academic',
            scope: 'section',
        };
        if (viewType === 'section') initialData.sectionId = selectedId!;
        if (viewType === 'teacher') initialData.teacherId = selectedId!;
        setModalData(initialData);
        setIsModalOpen(true);
    };

    const handleScheduleClick = (schedule: ClassSchedule) => {
        if (isReadOnly) return;
        setModalError(null);
        setModalData({ ...schedule, isEditing: true });
        setIsModalOpen(true);
    };

    const handleModalSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        const dataToSave: Omit<ClassSchedule, 'id'> = {
            title: modalData.title!, type: modalData.type!, scope: modalData.scope!,
            dayOfWeek: modalData.dayOfWeek!, startTime: modalData.startTime!, endTime: modalData.endTime!,
            sectionId: modalData.scope === 'section' ? modalData.sectionId : undefined,
            gradeLevel: modalData.scope === 'gradeLevel' ? modalData.gradeLevel : undefined,
            learningAreaId: modalData.type === 'academic' ? modalData.learningAreaId : undefined,
            teacherId: modalData.type === 'academic' ? modalData.teacherId : undefined,
        };
        
        if (!dataToSave.title || (dataToSave.type === 'academic' && (!dataToSave.learningAreaId || !dataToSave.teacherId || !dataToSave.sectionId))) {
            setModalError('Please fill all required fields for the selected event type.'); return;
        }
        if (dataToSave.startTime >= dataToSave.endTime) {
            setModalError('End time must be after start time.'); return;
        }
        
        let result = modalData.isEditing ? updateSchedule({ ...dataToSave, id: modalData.id! } as ClassSchedule) : addSchedule(dataToSave);
        if (result.success) setIsModalOpen(false); else setModalError(result.message || 'An unknown error occurred.');
    };
    
    const handleModalDelete = () => {
        if (modalData.isEditing && modalData.id) { deleteSchedule(modalData.id); setIsModalOpen(false); }
    };
    
    // --- Side Effects ---
    const options = useMemo(() => viewType === 'section' ? sections : teachers, [viewType, sections, teachers]);
    const gradeLevels = useMemo(() => Array.from(new Set(sections.map(s => s.gradeLevel))).sort(), [sections]);
    
    useEffect(() => {
        if (isParentView) {
            const childSectionId = students.find(s => s.id === forceStudentId)?.sectionId;
            setSelectedId(childSectionId || null);
        }
    }, [forceStudentId, students, isParentView]);
    
    useEffect(() => {
        if (isReadOnly) return;
        const currentSelectionExists = options.some(o => o.id === selectedId);
        if (!currentSelectionExists && options.length > 0) setSelectedId(options[0].id);
        else if (options.length === 0) setSelectedId(null);
    }, [options, selectedId, isReadOnly]);
    
    useEffect(() => {
        if (modalData.type === 'academic' && modalData.learningAreaId) {
            const la = learningAreas.find(l => l.id === modalData.learningAreaId);
            if (la) setModalData(p => ({...p, title: la.name}));
        }
    }, [modalData.type, modalData.learningAreaId, learningAreas]);

    const currentStudent = students.find(s => s.id === forceStudentId);
    const title = isStudentView ? 'My Class Schedule' : isParentView ? `Schedule for ${currentStudent?.name}` : 'Class Scheduler';

    // --- RENDER ---
    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{title}</h1>
            {notification && (
                <div className="fixed top-20 right-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse">
                    <strong className="font-bold">Conflict!</strong>
                    <span className="block sm:inline ml-2">{notification}</span>
                </div>
            )}
            <div className="flex flex-wrap items-center gap-4 mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                {!isReadOnly && (
                    <>
                        <div className="flex items-center space-x-2">
                            <label className="font-semibold">View by:</label>
                            <select value={viewType} onChange={e => { setViewType(e.target.value as 'section' | 'teacher'); }} className="input-style">
                                <option value="section">Class</option>
                                <option value="teacher">Teacher</option>
                            </select>
                        </div>
                         <div className="flex items-center space-x-2">
                            <label htmlFor="view-select" className="font-semibold capitalize">{viewType}:</label>
                            <select id="view-select" value={selectedId ?? ''} onChange={e => setSelectedId(e.target.value)} className="input-style min-w-[200px]">
                               {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                            </select>
                        </div>
                    </>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 relative grid grid-cols-[auto_1fr] text-sm h-[70vh]">
                <div className="relative col-start-1 row-start-1 flex flex-col">
                    <div className="h-10"></div> {/* Spacer for day headers */}
                    {timeSlots.slice(0, -1).map(time => (
                        <div key={time} className="pr-2 text-right text-xs text-slate-500 dark:text-slate-400 flex-1 flex items-start -translate-y-2">{time}</div>
                    ))}
                </div>

                <div className="relative col-start-2 row-start-1 grid grid-cols-5 h-full">
                    {days.map(day => (
                       <div key={day} className="text-center font-bold p-2 border-b border-l border-slate-200 dark:border-slate-700 h-10">{day}</div>
                    ))}
                    <div ref={gridRef} className="col-span-5 grid grid-cols-5 h-full relative" style={{ gridRowStart: 2 }}>
                        {Array.from({ length: TOTAL_HOURS * 2 }).map((_, i) => (
                            <div key={i} className="border-t border-slate-100 dark:border-slate-700/50" style={{gridColumn: (i%5)+1, gridRow: Math.floor(i/5)+1}}></div>
                        ))}
                         {days.map((day, dayIndex) => (
                            <div key={day} className="border-l border-slate-200 dark:border-slate-700 h-full" style={{gridColumn: dayIndex + 1, gridRow: '1 / -1'}}>
                                {timeSlots.slice(0, -1).map(time => (
                                    <div key={time} className="h-[60px] cursor-pointer" onClick={() => handleCellClick(day, time)}></div>
                                ))}
                            </div>
                        ))}

                        {/* SCHEDULED ITEMS */}
                        {filteredSchedules.map(schedule => {
                            const startMinutes = timeToMinutes(schedule.startTime);
                            const endMinutes = timeToMinutes(schedule.endTime);
                            const durationMinutes = endMinutes - startMinutes;
                            const dayIndex = days.indexOf(schedule.dayOfWeek);
                            if (dayIndex === -1 || durationMinutes <= 0) return null;

                            const totalMinutesInView = TOTAL_HOURS * 60;
                            const top = ((startMinutes - START_HOUR * 60) / totalMinutesInView) * 100;
                            const height = (durationMinutes / totalMinutesInView) * 100;
                            const left = (dayIndex / days.length) * 100;
                            const width = 100 / days.length;
                            
                            const section = sections.find(s => s.id === schedule.sectionId); const teacher = teachers.find(t => t.id === schedule.teacherId);
                            const isInteracting = activeInteraction?.schedule.id === schedule.id;

                            return (
                                <div key={schedule.id}
                                    onClick={() => handleScheduleClick(schedule)}
                                    onMouseDown={(e) => handleInteractionStart(e, 'drag', schedule)}
                                    className={`absolute p-2 rounded-lg border overflow-hidden transition-opacity ${!isReadOnly && 'cursor-grab'} ${getScheduleColor(schedule)} ${isInteracting ? 'opacity-50' : ''}`}
                                    style={{ top: `${top}%`, height: `${height}%`, left: `${left}%`, width: `calc(${width}% - 4px)`, transition: 'opacity 0.2s' }}>
                                    <p className="font-bold text-xs truncate">{schedule.title}</p>
                                    {schedule.type === 'academic' && <p className="text-xs truncate">{viewType === 'section' ? teacher?.name : section?.name}</p>}
                                    <p className="text-xs opacity-75">{`${schedule.startTime} - ${schedule.endTime}`}</p>
                                    {!isReadOnly && <div onMouseDown={(e) => handleInteractionStart(e, 'resize', schedule)} className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-black/10 hover:bg-black/20"></div>}
                                </div>
                            );
                        })}
                        {/* INDICATOR */}
                        {indicator && (
                             <div className={`absolute p-2 rounded-lg border-2 border-dashed border-indigo-500 bg-indigo-500/10 z-20 pointer-events-none`}
                                style={{ top: `${indicator.top}%`, height: `${indicator.height}%`, left: `${indicator.left}%`, width: `calc(${indicator.width}% - 4px)` }}>
                                <p className="font-bold text-xs truncate text-indigo-800 dark:text-indigo-200">{activeInteraction?.schedule.title}</p>
                                <p className="text-xs opacity-75 text-indigo-800 dark:text-indigo-200">{`${indicator.startTime} - ${indicator.endTime}`}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalData.isEditing ? 'Edit Schedule' : 'Add Schedule'} size="lg">
                 <form onSubmit={handleModalSave}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Event Type</label>
                            <select value={modalData.type ?? 'academic'} onChange={e => setModalData(p => ({...p, type: e.target.value as any, scope: e.target.value === 'academic' ? 'section' : 'all'}))} className="mt-1 w-full input-style">
                                <option value="academic">Academic Class</option>
                                <option value="extracurricular">Extracurricular Activity</option>
                            </select>
                        </div>
                        <div/>

                        {modalData.type === 'extracurricular' && (
                            <>
                            <div className="md:col-span-2"><label htmlFor="title" className="block text-sm font-medium">Title</label><input type="text" name="title" value={modalData.title ?? ''} onChange={e => setModalData(p => ({...p, title: e.target.value}))} className="mt-1 w-full input-style" required/></div>
                            <div><label className="block text-sm font-medium">Applies To (Scope)</label>
                                <select value={modalData.scope ?? 'all'} onChange={e => setModalData(p => ({...p, scope: e.target.value as any}))} className="mt-1 w-full input-style">
                                    <option value="all">Whole School</option>
                                    <option value="gradeLevel">Grade Level</option>
                                    <option value="section">Specific Section</option>
                                </select>
                            </div>
                             {modalData.scope === 'gradeLevel' && <div><label className="block text-sm font-medium">Grade Level</label><select value={modalData.gradeLevel ?? ''} onChange={e => setModalData(p => ({...p, gradeLevel: Number(e.target.value)}))} className="mt-1 w-full input-style"><option value="">Select...</option>{gradeLevels.map(gl => <option key={gl} value={gl}>{gl}</option>)}</select></div>}
                             {modalData.scope === 'section' && <div><label className="block text-sm font-medium">Section</label><select value={modalData.sectionId ?? ''} onChange={e => setModalData(p => ({...p, sectionId: e.target.value}))} className="mt-1 w-full input-style"><option value="">Select...</option>{sections.map(s => <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>)}</select></div>}
                            </>
                        )}
                        
                        {modalData.type === 'academic' && (
                           <>
                            <div className="md:col-span-2"><label className="block text-sm font-medium">Class</label><select name="sectionId" value={modalData.sectionId ?? ''} disabled={viewType==='section'} onChange={e => setModalData(p => ({...p, sectionId: e.target.value}))} className="mt-1 w-full input-style" required><option value="">Select...</option>{sections.map(s => <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>)}</select></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium">Learning Area</label><select name="learningAreaId" value={modalData.learningAreaId ?? ''} onChange={e => setModalData(p => ({...p, learningAreaId: e.target.value}))} className="mt-1 w-full input-style" required><option value="">Select...</option>{learningAreas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium">Teacher</label><select name="teacherId" value={modalData.teacherId ?? ''} disabled={viewType==='teacher'} onChange={e => setModalData(p => ({...p, teacherId: e.target.value}))} className="mt-1 w-full input-style" required><option value="">Select...</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                           </>
                        )}

                        <hr className="md:col-span-2 my-2"/>

                        <div><label className="block text-sm font-medium">Day</label><select name="dayOfWeek" value={modalData.dayOfWeek ?? ''} onChange={e => setModalData(p => ({...p, dayOfWeek: e.target.value as any}))} className="mt-1 w-full input-style" required><option value="">Select...</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                        <div/>
                        <div><label className="block text-sm font-medium">Start Time</label><input type="time" name="startTime" step="900" value={modalData.startTime ?? ''} onChange={e => setModalData(p => ({...p, startTime: e.target.value}))} className="mt-1 w-full input-style" required/></div>
                        <div><label className="block text-sm font-medium">End Time</label><input type="time" name="endTime" step="900" value={modalData.endTime ?? ''} onChange={e => setModalData(p => ({...p, endTime: e.target.value}))} className="mt-1 w-full input-style" required/></div>
                     </div>
                     {modalError && <p className="text-red-500 text-sm mt-4">{modalError}</p>}
                     <div className="flex justify-between items-center mt-6">
                        <div>{modalData.isEditing && <button type="button" onClick={handleModalDelete} className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold"><TrashIcon/> <span className="ml-1">Delete</span></button>}</div>
                        <div className="space-x-2"><button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button><button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save</button></div>
                     </div>
                 </form>
            </Modal>
            <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
        </div>
    );
};

export default SchedulerView;
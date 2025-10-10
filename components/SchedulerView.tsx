import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { AuthUser, StudentUser, ClassSchedule, Section, Teacher, LearningArea } from '../types';
import Modal from './Modal';
import { TrashIcon } from './icons';

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

const getWeekDates = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    // Adjust to Monday
    const day = startOfWeek.getDay(); // Sunday - 0, Monday - 1, ...
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    const weekDates: Date[] = [];
    for (let i = 0; i < 5; i++) {
        const nextDay = new Date(startOfWeek);
        nextDay.setDate(startOfWeek.getDate() + i);
        weekDates.push(nextDay);
    }
    return weekDates;
};


const SchedulerView: React.FC<{ schoolData: SchoolDataHook; session: { user: AuthUser | StudentUser, type: 'staff' | 'student' }; }> = ({ schoolData, session }) => {
    const { classSchedules, sections, teachers, learningAreas, addSchedule, updateSchedule, deleteSchedule } = schoolData;
    const isStudentView = session.type === 'student';
    
    const initialViewType = isStudentView ? 'section' : 'section';
    const initialSelectedId = isStudentView ? (session.user as StudentUser).sectionId : (sections[0]?.id || null);

    const [viewType, setViewType] = useState<'section' | 'teacher'>(initialViewType);
    const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<Partial<ClassSchedule> & { isEditing?: boolean }>({});
    const [modalError, setModalError] = useState<string | null>(null);

    const [currentDate, setCurrentDate] = useState(new Date());

    const timeSlots = Array.from({ length: 11 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`); // 7 AM to 5 PM
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

    const filteredSchedules = useMemo(() => {
        if (!selectedId) return [];
        if (viewType === 'teacher') {
            return classSchedules.filter(s => s.teacherId === selectedId);
        }
        // For section view
        const selectedSection = sections.find(s => s.id === selectedId);
        if (!selectedSection) return [];
        
        return classSchedules.filter(s => {
            if (s.scope === 'all') return true;
            if (s.scope === 'gradeLevel' && s.gradeLevel === selectedSection.gradeLevel) return true;
            if (s.scope === 'section' && s.sectionId === selectedId) return true;
            return false;
        });
    }, [classSchedules, selectedId, viewType, sections]);
    
    const handleCellClick = (day: string, time: string) => {
        if (isStudentView) return;
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
        if (viewType === 'teacher') {
            initialData.teacherId = selectedId!;
            // Teachers can only add academic classes for themselves.
        }
        setModalData(initialData);
        setIsModalOpen(true);
    };

    const handleScheduleClick = (schedule: ClassSchedule) => {
        if (isStudentView) return;
        setModalError(null);
        setModalData({ ...schedule, isEditing: true });
        setIsModalOpen(true);
    };

    const handleModalSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        const dataToSave: Omit<ClassSchedule, 'id'> = {
            title: modalData.title!,
            type: modalData.type!,
            scope: modalData.scope!,
            dayOfWeek: modalData.dayOfWeek!,
            startTime: modalData.startTime!,
            endTime: modalData.endTime!,
            sectionId: modalData.scope === 'section' ? modalData.sectionId : undefined,
            gradeLevel: modalData.scope === 'gradeLevel' ? modalData.gradeLevel : undefined,
            learningAreaId: modalData.type === 'academic' ? modalData.learningAreaId : undefined,
            teacherId: modalData.type === 'academic' ? modalData.teacherId : undefined,
        };
        
        if (!dataToSave.title || (dataToSave.type === 'academic' && (!dataToSave.learningAreaId || !dataToSave.teacherId || !dataToSave.sectionId))) {
            setModalError('Please fill all required fields for the selected event type.');
            return;
        }

        if (dataToSave.startTime >= dataToSave.endTime) {
            setModalError('End time must be after start time.');
            return;
        }
        
        let result;
        if (modalData.isEditing) {
            result = updateSchedule({ ...dataToSave, id: modalData.id! } as ClassSchedule);
        } else {
            result = addSchedule(dataToSave);
        }
        
        if (result.success) {
            setIsModalOpen(false);
        } else {
            setModalError(result.message || 'An unknown error occurred.');
        }
    };
    
    const handleModalDelete = () => {
        if (modalData.isEditing && modalData.id) {
            deleteSchedule(modalData.id);
            setIsModalOpen(false);
        }
    };

    const options = useMemo(() => viewType === 'section' ? sections : teachers, [viewType, sections, teachers]);
    const gradeLevels = useMemo(() => Array.from(new Set(sections.map(s => s.gradeLevel))).sort(), [sections]);
    
    useEffect(() => {
        if (isStudentView) return;
        const currentSelectionExists = options.some(o => o.id === selectedId);
        if (!currentSelectionExists && options.length > 0) {
            setSelectedId(options[0].id);
        } else if (options.length === 0) {
            setSelectedId(null);
        }
    }, [options, selectedId, isStudentView]);
    
    useEffect(() => {
        if (modalData.type === 'academic' && modalData.learningAreaId) {
            const la = learningAreas.find(l => l.id === modalData.learningAreaId);
            if (la) setModalData(p => ({...p, title: la.name}));
        }
    }, [modalData.type, modalData.learningAreaId, learningAreas]);


    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{isStudentView ? 'My Class Schedule' : 'Class Scheduler'}</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                {!isStudentView && (
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
                 <div className="flex items-center space-x-2">
                    <label htmlFor="date-picker" className="font-semibold">Week of:</label>
                    <input
                        type="date"
                        id="date-picker"
                        value={currentDate.toISOString().split('T')[0]}
                        onChange={e => setCurrentDate(new Date(e.target.value))}
                        className="input-style"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 relative grid grid-cols-[auto_1fr] text-sm" style={{gridTemplateRows: `auto repeat(${timeSlots.length}, minmax(60px, 1fr))`}}>
                {/* Corner */}
                <div className="sticky top-0 z-10"></div>
                {/* Days Header */}
                <div className="col-start-2 grid grid-cols-5 sticky top-0 bg-white dark:bg-slate-800 z-10">
                    {weekDates.map((date, index) => (
                       <div key={days[index]} className="text-center font-bold p-2 border-b border-slate-200 dark:border-slate-700">
                           <div>{days[index]}</div>
                           <div className="text-xs font-normal text-slate-500 dark:text-slate-400">
                               {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                           </div>
                        </div>
                    ))}
                </div>
                {/* Time Slots & Grid */}
                {timeSlots.map((time, index) => (
                    <React.Fragment key={time}>
                        <div className="pr-2 text-right text-xs text-slate-500 dark:text-slate-400 row-start-auto" style={{ gridRow: index + 2 }}>{time}</div>
                        <div className="col-start-2 grid grid-cols-5 border-t border-slate-200 dark:border-slate-700">
                           {weekDates.map((_date, dayIndex) => (
                               <div key={`${days[dayIndex]}-${time}`} onClick={() => handleCellClick(days[dayIndex], time)} className={`border-l border-slate-200 dark:border-slate-700 h-full ${!isStudentView && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}></div>
                           ))}
                        </div>
                    </React.Fragment>
                ))}
                
                {/* Rendered Schedules */}
                {filteredSchedules.map(schedule => {
                    const startMinutes = timeToMinutes(schedule.startTime);
                    const endMinutes = timeToMinutes(schedule.endTime);
                    const durationMinutes = endMinutes - startMinutes;
                    
                    const dayIndex = days.indexOf(schedule.dayOfWeek);
                    if (dayIndex === -1) return null;
                    
                    const topOffset = (startMinutes - timeToMinutes(timeSlots[0])) / 60;
                    const height = durationMinutes / 60;
                    
                    const section = sections.find(s => s.id === schedule.sectionId);
                    const teacher = teachers.find(t => t.id === schedule.teacherId);
                    
                    return (
                        <div key={schedule.id}
                            onClick={() => handleScheduleClick(schedule)}
                            className={`absolute p-2 rounded-lg border ${!isStudentView && 'cursor-pointer'} overflow-hidden ${getScheduleColor(schedule)}`}
                            style={{
                                top: `calc(2.5rem + (${topOffset} / ${timeSlots.length}) * (100% - 2.5rem))`,
                                left: `calc(4rem + (${dayIndex} / 5) * (100% - 4rem))`,
                                width: `calc((100% - 4rem) / 5 - 0.5rem)`,
                                height: `calc((${height} / ${timeSlots.length}) * (100% - 2.5rem) - 0.25rem)`,
                            }}>
                            <p className="font-bold text-xs truncate">{schedule.title}</p>
                            {schedule.type === 'academic' && <p className="text-xs truncate">{viewType === 'section' ? teacher?.name : section?.name}</p>}
                            <p className="text-xs opacity-75">{`${schedule.startTime} - ${schedule.endTime}`}</p>
                        </div>
                    );
                })}
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
            <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: inherit; background-color: transparent; padding: 0.5rem 0.75rem; }`}</style>
        </div>
    );
};

export default SchedulerView;
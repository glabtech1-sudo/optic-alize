import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock, Sparkles, 
  MapPin, CheckCircle2, AlertTriangle, MessageSquare, Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage?: 'FR' | 'EN';
  currentDate?: Date;
}

// Simulated appointments for aesthetic realism in Optic Alizé
interface SimulatedExam {
  id: string;
  patientName: string;
  time: string;
  day: number; // For the current/selected month
  type: 'Examen de vue' | 'Livraison d\'équipement' | 'Ajustement monture' | 'Visite de contrôle';
  advisor: string;
}

const SIMULATED_EXAMS: SimulatedExam[] = [
  { id: '1', patientName: 'Jean Dupont', time: '10:00', day: 18, type: 'Examen de vue', advisor: 'Dr. Clavel' },
  { id: '2', patientName: 'Hélène Dubois', time: '11:30', day: 18, type: 'Livraison d\'équipement', advisor: 'Antoine Roussel' },
  { id: '3', patientName: 'Antoine Roussel', time: '14:00', day: 20, type: 'Ajustement monture', advisor: 'Mélanie Lopez' },
  { id: '4', patientName: 'Marc Lemaire', time: '09:15', day: 22, type: 'Visite de contrôle', advisor: 'Dr. Lecerf' },
  { id: '5', patientName: 'Sophie Bernard', time: '16:45', day: 25, type: 'Examen de vue', advisor: 'Dr. Clavel' },
];

export default function CalendarModal({ 
  isOpen, 
  onClose, 
  currentLanguage = 'FR', 
  currentDate = new Date() 
}: CalendarModalProps) {
  
  const [navDate, setNavDate] = useState<Date>(new Date(currentDate));
  const [selectedDay, setSelectedDay] = useState<number | null>(currentDate.getDate());

  if (!isOpen) return null;

  const currentYear = navDate.getFullYear();
  const currentMonthNum = navDate.getMonth(); // 0-indexed

  // Months names in French & English
  const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAYS_OF_WEEK_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const DAYS_OF_WEEK_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const monthName = currentLanguage === 'FR' ? MONTHS_FR[currentMonthNum] : MONTHS_EN[currentMonthNum];
  const daysOfWeek = currentLanguage === 'FR' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK_EN;

  // Calculate days in the nav node
  // The number of days in current nav month:
  const daysInMonth = new Date(currentYear, currentMonthNum + 1, 0).getDate();

  // Day of the week of the first day of the month (0 = Sunday, 1 = Monday ...)
  // Change to 1-indexed for Monday-start layout:
  let firstDayIndex = new Date(currentYear, currentMonthNum, 1).getDay();
  // Adjust so Monday is index 0, Sunday is index 6
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Let's create the array of day numbers:
  const dayNodes: (number | null)[] = [];
  // Fill with empty spaces at start:
  for (let i = 0; i < firstDayIndex; i++) {
    dayNodes.push(null);
  }
  // Fill with month days:
  for (let day = 1; day <= daysInMonth; day++) {
    dayNodes.push(day);
  }

  // Navigation handlers
  const handlePrevMonth = () => {
    setNavDate(new Date(currentYear, currentMonthNum - 1, 1));
    setSelectedDay(null); // Reset selection when moving months
  };

  const handleNextMonth = () => {
    setNavDate(new Date(currentYear, currentMonthNum + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    const today = new Date();
    setNavDate(new Date(today));
    setSelectedDay(today.getDate());
  };

  // Determine if a day is today
  const isToday = (dayNum: number) => {
    const today = new Date();
    return today.getDate() === dayNum && 
           today.getMonth() === currentMonthNum && 
           today.getFullYear() === currentYear;
  };

  // Filter exams occurring on selected day of current nav month
  const dayExams = selectedDay 
    ? SIMULATED_EXAMS.filter(e => e.day === selectedDay && navDate.getMonth() === new Date().getMonth() && navDate.getFullYear() === new Date().getFullYear())
    : [];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="unified-calendar-modal-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
      >
        
        {/* Left Side: Interactive Calendar Grid */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
          
          {/* Calendar Header with Navigation controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-indigo text-cyan-600 font-mono block">
                {currentLanguage === 'FR' ? "Calendrier d'Établissement" : "Enterprise System Calendar"}
              </span>
              <h2 className="text-xl font-extrabold text-slate-800 font-sans flex items-center gap-1.5 leading-none">
                <CalendarIcon className="w-5 h-5 text-cyan-600" />
                <span>{monthName} {currentYear}</span>
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button 
                onClick={handlePrevMonth}
                title={currentLanguage === 'FR' ? "Mois précédent" : "Previous Month"}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-950 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button 
                onClick={handleToday}
                className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white text-cyan-700 hover:text-cyan-800 rounded-lg shadow-sm border border-slate-200 cursor-pointer"
              >
                {currentLanguage === 'FR' ? "Aujourd'hui" : "Today"}
              </button>

              <button 
                onClick={handleNextMonth}
                title={currentLanguage === 'FR' ? "Mois suivant" : "Next Month"}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-950 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week titles */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="py-1">{day}</div>
            ))}
          </div>

          {/* Monthly Day Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {dayNodes.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="p-3.5" />;
              }

              const isSelected = selectedDay === day;
              const hasEvents = SIMULATED_EXAMS.some(e => e.day === day && navDate.getMonth() === new Date().getMonth() && navDate.getFullYear() === new Date().getFullYear());
              const isTodayCell = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`p-3 rounded-2xl relative font-sans font-semibold transition-all group flex flex-col items-center justify-center cursor-pointer ${
                    isSelected 
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 scale-105' 
                      : isTodayCell
                        ? 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                        : 'hover:bg-slate-50 text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <span className={isSelected ? 'font-black scale-110' : ''}>{day}</span>

                  {/* Red dot/badge for events */}
                  {hasEvents && (
                    <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${
                      isSelected ? 'bg-white' : 'bg-rose-500'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Optic Alizé • Planification Clinique</span>
            <span className="flex items-center gap-1 text-cyan-600 font-bold uppercase">
              <Clock className="w-3.5 h-3.5" />
              GMT +0 (UTC)
            </span>
          </div>

        </div>

        {/* Right Side: Appointment & Detail summary drawer */}
        <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 font-mono">
                {selectedDay 
                  ? `${selectedDay} ${monthName} ${currentYear}`
                  : "Sélectionnez un jour"}
              </h3>
              <button 
                onClick={onClose}
                className="p-1 px-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-lg transition text-xs font-mono cursor-pointer border-0"
              >
                ✕ Fermer
              </button>
            </div>

            {/* Quick Stats overview */}
            <div className="p-3.5 bg-gradient-to-br from-cyan-900 to-indigo-950 text-white rounded-2xl border border-cyan-800/10 shadow-sm relative overflow-hidden">
              <Sparkles className="w-12 h-12 text-cyan-400/10 absolute -right-2 -bottom-2 rotate-12" />
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold font-mono text-[9px] uppercase tracking-widest mb-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Statut du Jour</span>
              </div>
              <div className="text-sm font-bold truncate">
                {dayExams.length > 0 
                  ? `${dayExams.length} Rendez-vous planifiés`
                  : "Aucun rdv clinique planifié"}
              </div>
              <p className="text-[10px] text-cyan-200/70 mt-1 leading-relaxed">
                {dayExams.length > 0 
                  ? "Assurez-vous que l'atelier et l'ophtalmologiste d'astreinte sont synchronisés."
                  : "Journée propice aux inventaires et aux commandes de verres en attente."}
              </p>
            </div>

            {/* List of medical appointments */}
            <div className="space-y-3">
              <h4 className="text-[9.5px] uppercase font-bold text-slate-500 font-mono tracking-wider block">
                Agenda Clinique ({dayExams.length})
              </h4>

              {dayExams.length > 0 ? (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {dayExams.map(exam => (
                    <div key={exam.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-xs space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-slate-800 truncate">{exam.patientName}</span>
                        <span className="px-1.5 py-0.5 bg-cyan-50 border border-cyan-150 text-cyan-700 font-bold font-mono text-[9px] rounded">
                          {exam.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-600" />
                          Prat: {exam.advisor}
                        </span>
                        <span className="font-semibold text-slate-700">{exam.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
                  <Info className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                  <p className="text-[10.5px] text-slate-500 font-medium">Libre pour examens spontanés ou accueil clients magasin.</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[9px] font-mono text-slate-400 pt-4 border-t border-slate-200 leading-relaxed text-left">
            💡 Astuce : Les rendez-vous s'incrémentent en liaison directe après validation d'un règlement au guichet POS.
          </p>

        </div>

      </motion.div>
    </div>
  );
}

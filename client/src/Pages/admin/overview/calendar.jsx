import { useState, useEffect, useMemo } from 'react';
import { getPurposeColor } from '../../../lib/purposeColors';
import axios from 'axios';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  RotateCcw
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

const VIEWS = ['monthly', 'weekly', 'daily'];
const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];



function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells = [];
  // Previous month padding
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, -(startOffset - 1 - i));
    cells.push({ date: d, isCurrentMonth: false });
  }
  // Current month
  for (let i = 1; i <= totalDays; i++) {
    cells.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  // Next month padding
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }
  return cells;
}

function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(start);
    dd.setDate(start.getDate() + i);
    dates.push(dd);
  }
  return dates;
}

function Calendar({ userMode = false }) {
  const [deliveries, setDeliveries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(userMode ? 'Pending' : 'all');

  const toast = useAppToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [deliveriesRes, vehiclesRes] = await Promise.all([
        axios.get('/api/deliveries'),
        axios.get('/api/vehicles')
      ]);
      setDeliveries(deliveriesRes.data);
      setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleDisplay = (plateNumber) => {
    const vObj = vehicles.find(x => x.plateNumber === plateNumber);
    return vObj ? `${plateNumber} - ${vObj.model}` : plateNumber || '—';
  };

  // Unique filter option lists
  const uniqueVehicles = useMemo(() => [...new Set(deliveries.map(d => d.vehicleEquipment).filter(Boolean))].sort(), [deliveries]);
  const uniqueDestinations = useMemo(() => [...new Set(deliveries.flatMap(d => d.customerSupplier || []).filter(Boolean))].sort(), [deliveries]);

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const vehicleMatch = vehicleFilter === 'all' || d.vehicleEquipment === vehicleFilter;
      const destinationMatch = destinationFilter === 'all' || (d.customerSupplier || []).includes(destinationFilter);
      const statusMatch = userMode 
        ? (d.status || 'Pending') === 'Pending'
        : (statusFilter === 'all' || (d.status || 'Pending') === statusFilter);
      return vehicleMatch && destinationMatch && statusMatch;
    });
  }, [deliveries, vehicleFilter, destinationFilter, statusFilter]);

  const hasActiveFilters = vehicleFilter !== 'all' || 
    destinationFilter !== 'all' || 
    statusFilter !== (userMode ? 'Pending' : 'all');

  const resetFilters = () => {
    setVehicleFilter('all');
    setDestinationFilter('all');
    setStatusFilter(userMode ? 'Pending' : 'all');
  };

  // Build a map of dateKey -> deliveries for that date
  const deliveryMap = useMemo(() => {
    const map = {};
    filteredDeliveries.forEach(d => {
      if (!d.dateFrom) return;
      const from = new Date(d.dateFrom);
      const to = d.dateTo ? new Date(d.dateTo) : from;
      const cur = new Date(from);
      while (cur <= to) {
        const key = getDateKey(cur);
        if (!map[key]) map[key] = [];
        map[key].push(d);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [filteredDeliveries]);



  // Navigation
  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    const d = new Date(currentDate);
    if (view === 'monthly') d.setMonth(d.getMonth() - 1);
    else if (view === 'weekly') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goNext = () => {
    const d = new Date(currentDate);
    if (view === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (view === 'weekly') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const getHeaderLabel = () => {
    if (view === 'monthly') {
      return currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    }
    if (view === 'weekly') {
      const week = getWeekDates(currentDate);
      const from = week[0];
      const to = week[6];
      const fmtShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fmtShort(from)} — ${fmtShort(to)}, ${to.getFullYear()}`.toUpperCase();
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  const joinArray = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const filtered = arr.filter(Boolean);
    return filtered.length > 0 ? filtered.join(' / ') : '—';
  };

  const today = new Date();

  // --- Delivery Card ---
  const DeliveryCard = ({ delivery, compact = false }) => {
    const color = getPurposeColor(delivery.purpose);
    const vehicle = getVehicleDisplay(delivery.vehicleEquipment);
    const destination = joinArray(delivery.customerSupplier);
    const purpose = joinArray(delivery.purpose);

    const statusColor = delivery.status === 'Completed'
      ? 'bg-emerald-500'
      : delivery.status === 'In Transit'
        ? 'bg-blue-500'
        : 'bg-amber-500';

    if (compact) {
      return (
        <div className={`px-1.5 py-1 rounded ${color.bg} border ${color.border} cursor-default transition-all hover:scale-[1.02]`}>
          <div className={`text-[8px] font-bold ${color.text} uppercase tracking-tight leading-tight truncate`}>
            {vehicle} — {destination}
          </div>
          <div className="text-[7px] text-muted-foreground uppercase truncate leading-tight">{purpose}</div>
        </div>
      );
    }

    return (
      <div className={`px-3 py-2.5 rounded-lg ${color.bg} border ${color.border} cursor-default transition-all hover:shadow-md`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`h-1.5 w-1.5 rounded-full ${statusColor} shrink-0`} />
          <span className={`text-[10px] font-bold ${color.text} uppercase tracking-tight truncate`}>
            {vehicle} — {destination}
          </span>
        </div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider truncate pl-3.5">{purpose}</div>
      </div>
    );
  };

  // --- EVENT POSITIONING HELPERS ---
  // Groups cells into weeks and computes continuous event positions
  const getMonthsEvents = (cells) => {
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    return weeks.map(week => {
      const weekStart = week[0].date;
      const weekEnd = week[6].date;
      weekStart.setHours(0,0,0,0);
      weekEnd.setHours(23,59,59,999);

      // Find deliveries that overlap this week
      const overlapping = filteredDeliveries.filter(d => {
        if (!d.dateFrom) return false;
        const dStart = new Date(d.dateFrom);
        dStart.setHours(0,0,0,0);
        const dEnd = d.dateTo ? new Date(d.dateTo) : new Date(dStart);
        dEnd.setHours(23,59,59,999);
        return dStart <= weekEnd && dEnd >= weekStart;
      });

      // Sort by length (longest first), then start date
      overlapping.sort((a, b) => {
        const aLen = (a.dateTo ? new Date(a.dateTo) : new Date(a.dateFrom)) - new Date(a.dateFrom);
        const bLen = (b.dateTo ? new Date(b.dateTo) : new Date(b.dateFrom)) - new Date(b.dateFrom);
        if (bLen !== aLen) return bLen - aLen;
        return new Date(a.dateFrom) - new Date(b.dateFrom);
      });

      const slots = []; // array of busy days per slot index
      const events = overlapping.map(d => {
        const dStart = new Date(d.dateFrom);
        dStart.setHours(0,0,0,0);
        const dEnd = d.dateTo ? new Date(d.dateTo) : new Date(dStart);
        dEnd.setHours(23,59,59,999);

        // Map start/end to this week
        const isTrueStart = dStart >= weekStart;
        const isTrueEnd = dEnd <= weekEnd;

        const startDayNode = isTrueStart ? dStart : weekStart;
        const endDayNode = isTrueEnd ? dEnd : weekEnd;

        // Flatten times to midnight to calculate pure day differences accurately
        const flatStart = new Date(startDayNode);
        flatStart.setHours(0,0,0,0);
        const flatEnd = new Date(endDayNode);
        flatEnd.setHours(0,0,0,0);

        // Calculate offset (0-6) and span (1-7)
        const offset = Math.round((flatStart - weekStart) / (1000 * 60 * 60 * 24));
        const span = Math.round((flatEnd - flatStart) / (1000 * 60 * 60 * 24)) + 1;

        // Find an open slot
        let slotIdx = 0;
        while (true) {
          if (!slots[slotIdx]) slots[slotIdx] = new Array(7).fill(false);
          let canFit = true;
          for (let i = offset; i < offset + span; i++) {
            if (slots[slotIdx][i]) { canFit = false; break; }
          }
          if (canFit) {
            for (let i = offset; i < offset + span; i++) slots[slotIdx][i] = true;
            break;
          }
          slotIdx++;
        }

        return { delivery: d, offset, span, slotIdx, isTrueStart, isTrueEnd };
      });

      return { week, events, maxSlots: slots.length };
    });
  };

  // --- MONTHLY VIEW ---
  const MonthlyView = () => {
    const cells = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth());
    const weeksData = getMonthsEvents(cells);

    return (
      <div className="flex flex-col flex-1 min-h-0 bg-muted/10">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-card shrink-0 shadow-sm z-10">
          {DAY_LABELS.map(d => (
            <div key={d} className="px-2 py-2 text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar body (scrolling) */}
        <div className="flex-1 overflow-auto flex flex-col min-h-0">
          {weeksData.map((wData, wIdx) => {
            // Base row height of 60px minimum, expanding if there are many events
            const rowHeightClass = Math.max(60, 24 + (wData.maxSlots * 36)) + 'px';

            return (
              <div key={wIdx} className="relative grid grid-cols-7 border-b border-border/50 shrink-0" style={{ minHeight: rowHeightClass }}>
                {/* Background cells (clickable) */}
                {wData.week.map((cell, cIdx) => {
                  const isToday = isSameDay(cell.date, today);
                  return (
                    <div
                      key={cIdx}
                      className={`border-r border-border/50 transition-colors p-1 cursor-pointer
                        ${!cell.isCurrentMonth ? 'bg-muted/30 opacity-60' : 'bg-card hover:bg-muted/10'}
                        ${isToday ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}
                      `}
                      onClick={() => { setCurrentDate(new Date(cell.date)); setView('daily'); }}
                    >
                      <div className={`text-[10px] font-bold max-w-fit px-1 rounded-sm
                        ${isToday ? 'bg-primary text-primary-foreground' : cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                      `}>
                        {cell.date.getDate()}
                      </div>
                    </div>
                  );
                })}

                {/* Absolute Event Overlays */}
                {wData.events.map((ev, eIdx) => {
                  const color = getPurposeColor(ev.delivery.purpose);
                  const vehicle = getVehicleDisplay(ev.delivery.vehicleEquipment);
                  const destination = joinArray(ev.delivery.customerSupplier);
                  const purpose = joinArray(ev.delivery.purpose);
                  const activity = joinArray(ev.delivery.activity);
                  const isMultiDay = ev.span > 1 || !ev.isTrueStart || !ev.isTrueEnd;

                  // Remove padding/rounding if the event bridges to previous/next week
                  const padLeft = ev.isTrueStart ? 'pl-1' : 'pl-0';
                  const padRight = ev.isTrueEnd ? 'pr-1' : 'pr-0';
                  const roundLeft = ev.isTrueStart ? 'rounded-l-[3px]' : 'rounded-l-none border-l-0';
                  const roundRight = ev.isTrueEnd ? 'rounded-r-[3px]' : 'rounded-r-none border-r-0';

                  // Use right: 0 and left: 0 to perfectly pin to the container edges, eliminating subpixel gaps
                  const styleProps = {
                    top: `${22 + (ev.slotIdx * 36)}px`,
                    height: '32px',
                    zIndex: 5
                  };

                  if (ev.offset === 0 && ev.span === 7) {
                    styleProps.left = '0px';
                    styleProps.right = '0px';
                  } else if (ev.offset === 0) {
                    styleProps.left = '0px';
                    styleProps.width = `${(ev.span / 7) * 100}%`;
                  } else if (ev.offset + ev.span === 7) {
                    styleProps.left = `${(ev.offset / 7) * 100}%`;
                    styleProps.right = '0px';
                  } else {
                    styleProps.left = `${(ev.offset / 7) * 100}%`;
                    styleProps.width = `${(ev.span / 7) * 100}%`;
                  }

                  return (
                    <div
                      key={ev.delivery._id + '-' + eIdx}
                      className={`absolute pointer-events-none ${padLeft} ${padRight}`}
                      style={styleProps}
                    >
                      <div className={`w-full h-full flex flex-col justify-center px-1.5 border ${color.bg} ${color.border} ${color.text} shadow-sm overflow-hidden ${roundLeft} ${roundRight}`}>
                        <span className={`text-[8px] font-bold uppercase tracking-tight truncate leading-tight`}>
                          {ev.isTrueStart || ev.offset === 0 ? `${vehicle} — ${destination}` : ''}
                        </span>
                        {(ev.isTrueStart || ev.offset === 0) && (
                          <span className="text-[7px] text-muted-foreground uppercase tracking-tight truncate leading-tight">
                            {purpose} {activity && ` — ${activity}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- WEEKLY VIEW ---
  const WeeklyView = () => {
    const weekDates = getWeekDates(currentDate);

    // Filter events for this week using the same logic as monthly
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    weekStart.setHours(0,0,0,0);
    weekEnd.setHours(23,59,59,999);

    const overlapping = filteredDeliveries.filter(d => {
      if (!d.dateFrom) return false;
      const dStart = new Date(d.dateFrom);
      dStart.setHours(0,0,0,0);
      const dEnd = d.dateTo ? new Date(d.dateTo) : new Date(dStart);
      dEnd.setHours(23,59,59,999);
      return dStart <= weekEnd && dEnd >= weekStart;
    });

    overlapping.sort((a, b) => {
      const aLen = (a.dateTo ? new Date(a.dateTo) : new Date(a.dateFrom)) - new Date(a.dateFrom);
      const bLen = (b.dateTo ? new Date(b.dateTo) : new Date(b.dateFrom)) - new Date(b.dateFrom);
      if (bLen !== aLen) return bLen - aLen;
      return new Date(a.dateFrom) - new Date(b.dateFrom);
    });

    const slots = [];
    const events = overlapping.map(d => {
      const dStart = new Date(d.dateFrom);
      dStart.setHours(0,0,0,0);
      const dEnd = d.dateTo ? new Date(d.dateTo) : new Date(dStart);
      dEnd.setHours(23,59,59,999);

      const isTrueStart = dStart >= weekStart;
      const isTrueEnd = dEnd <= weekEnd;

      const startDayNode = isTrueStart ? dStart : weekStart;
      const endDayNode = isTrueEnd ? dEnd : weekEnd;

      // Flatten times to midnight to calculate pure day differences accurately
      const flatStart = new Date(startDayNode);
      flatStart.setHours(0,0,0,0);
      const flatEnd = new Date(endDayNode);
      flatEnd.setHours(0,0,0,0);

      // Calculate offset (0-6) and span (1-7)
      const offset = Math.round((flatStart - weekStart) / (1000 * 60 * 60 * 24));
      const span = Math.round((flatEnd - flatStart) / (1000 * 60 * 60 * 24)) + 1;

      let slotIdx = 0;
      while (true) {
        if (!slots[slotIdx]) slots[slotIdx] = new Array(7).fill(false);
        let canFit = true;
        for (let i = offset; i < offset + span; i++) {
          if (slots[slotIdx][i]) { canFit = false; break; }
        }
        if (canFit) {
          for (let i = offset; i < offset + span; i++) slots[slotIdx][i] = true;
          break;
        }
        slotIdx++;
      }

      return { delivery: d, offset, span, slotIdx, isTrueStart, isTrueEnd };
    });

    const maxSlots = slots.length;
    const rowHeightClass = Math.max(140, 24 + (maxSlots * 36)) + 'px';

    return (
      <div className="flex flex-col flex-1 min-h-0 bg-muted/10">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-card shrink-0 shadow-sm z-10">
          {weekDates.map((d, i) => {
            const isToday = isSameDay(d, today);
            return (
              <div key={i} className={`px-2 py-2 text-center ${isToday ? 'bg-primary/10' : ''}`}>
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{DAY_LABELS[i]}</div>
                <div className={`text-[11px] font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        
        {/* Cards grid */}
        <div className="flex-1 overflow-auto flex flex-col min-h-0">
          <div className="relative grid grid-cols-7 border-b border-border/50 shrink-0" style={{ minHeight: rowHeightClass }}>
            {/* Background cells */}
            {weekDates.map((d, i) => {
              const isToday = isSameDay(d, today);
              return (
                <div
                  key={i}
                  className={`border-r border-border/50 transition-colors p-1.5 cursor-pointer
                    ${isToday ? 'bg-primary/5' : 'bg-card hover:bg-muted/10'}
                  `}
                  onClick={() => { setCurrentDate(new Date(d)); setView('daily'); }}
                />
              );
            })}

            {/* Absolute Event Overlays */}
            {events.map((ev, eIdx) => {
              const color = getPurposeColor(ev.delivery.purpose);
              const vehicle = getVehicleDisplay(ev.delivery.vehicleEquipment);
              const destination = joinArray(ev.delivery.customerSupplier);
              const purpose = joinArray(ev.delivery.purpose);
              const activity = joinArray(ev.delivery.activity);
              const isMultiDay = ev.span > 1 || !ev.isTrueStart || !ev.isTrueEnd;

              const padLeft = ev.isTrueStart ? 'pl-1' : 'pl-0';
              const padRight = ev.isTrueEnd ? 'pr-1' : 'pr-0';
              const roundLeft = ev.isTrueStart ? 'rounded-l-[3px]' : 'rounded-l-none border-l-0';
              const roundRight = ev.isTrueEnd ? 'rounded-r-[3px]' : 'rounded-r-none border-r-0';

              // Use right: 0 and left: 0 to perfectly pin to the container edges, eliminating subpixel gaps
              const styleProps = {
                top: `${14 + (ev.slotIdx * 36)}px`,
                height: '32px',
                zIndex: 5
              };

              if (ev.offset === 0 && ev.span === 7) {
                styleProps.left = '0px';
                styleProps.right = '0px';
              } else if (ev.offset === 0) {
                styleProps.left = '0px';
                styleProps.width = `${(ev.span / 7) * 100}%`;
              } else if (ev.offset + ev.span === 7) {
                styleProps.left = `${(ev.offset / 7) * 100}%`;
                styleProps.right = '0px';
              } else {
                styleProps.left = `${(ev.offset / 7) * 100}%`;
                styleProps.width = `${(ev.span / 7) * 100}%`;
              }

              return (
                <div
                  key={ev.delivery._id + '-' + eIdx}
                  className={`absolute pointer-events-none ${padLeft} ${padRight}`}
                  style={styleProps}
                >
                  <div className={`w-full h-full flex flex-col justify-center px-1.5 border ${color.bg} ${color.border} ${color.text} shadow-sm overflow-hidden ${roundLeft} ${roundRight}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-tight truncate leading-tight`}>
                      {ev.isTrueStart || ev.offset === 0 ? `${vehicle} — ${destination}` : ''}
                    </span>
                    {(ev.isTrueStart || ev.offset === 0) && (
                      <span className="text-[7px] text-muted-foreground uppercase tracking-tight truncate leading-tight">
                        {purpose} {activity && ` — ${activity}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {events.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest bg-card px-3 py-1 rounded">No deliveries scheduled this week</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- DAILY VIEW ---
  const DailyView = () => {
    const key = getDateKey(currentDate);
    const dayDeliveries = deliveryMap[key] || [];
    const isToday = isSameDay(currentDate, today);
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4">
          <h2 className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
            {isToday && <span className="ml-2 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">TODAY</span>}
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
            {dayDeliveries.length} {dayDeliveries.length === 1 ? 'delivery' : 'deliveries'} scheduled
          </p>
        </div>

        {dayDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center opacity-60">
            <CalendarIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-[11px] font-bold text-foreground uppercase tracking-tight">No deliveries scheduled</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">This date has no planned deliveries.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            {dayDeliveries.map((del, di) => {
              const color = getPurposeColor(del.purpose);
              const statusColor = del.status === 'Completed'
                ? 'bg-emerald-500'
                : del.status === 'In Transit'
                  ? 'bg-blue-500'
                  : 'bg-amber-500';
              const statusLabel = del.status || 'Pending';

              return (
                <div key={del._id + '-' + di} className={`rounded-lg border ${color.border} ${color.bg} p-3 transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-2 w-2 rounded-full ${statusColor} shrink-0`} />
                        <span className={`text-[11px] font-bold ${color.text} uppercase tracking-tight truncate`}>
                          {getVehicleDisplay(del.vehicleEquipment)} — {joinArray(del.customerSupplier)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider pl-4 truncate">
                        {joinArray(del.purpose)}
                        {del.activity?.length > 0 && ` — ${joinArray(del.activity)}`}
                      </div>
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor} text-white shrink-0`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2 pt-2 border-t border-border/30 pl-4">
                    <div>
                      <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Driver</div>
                      <div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArray(del.driver)}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Helper</div>
                      <div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArray(del.helper)}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Job Order</div>
                      <div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArray(del.jobOrderNo)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const viewIcon = view === 'monthly'
    ? <CalendarDays className="h-3.5 w-3.5" />
    : view === 'weekly'
      ? <CalendarRange className="h-3.5 w-3.5" />
      : <CalendarIcon className="h-3.5 w-3.5" />;

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Delivery Calendar</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Schedule overview for all delivery plans</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={goPrev} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-[11px] font-bold text-foreground uppercase tracking-tight min-w-[130px] text-center mx-1">
            {getHeaderLabel()}
          </span>

          <Button variant="outline" size="sm" onClick={goNext} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={goToday} className="h-8 px-3 ml-2 text-[10px] font-bold uppercase tracking-wider">
            Today
          </Button>
          
          <div className="relative ml-1.5">
            <input
              type="date"
              value={getDateKey(currentDate)}
              onChange={(e) => { if (e.target.value) setCurrentDate(new Date(e.target.value + 'T00:00:00')); }}
              className="h-8 rounded border border-input bg-background px-2.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </div>

        {/* View Toggle + Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-8 bg-background">
                <i className='bx bx-car text-sm'></i>
                <span className="text-[10px]">Vehicle</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-[10px] max-h-[200px] overflow-y-auto">
              <DropdownMenuLabel className="text-[10px]">Filter by Vehicle</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem className="text-[10px]" checked={vehicleFilter === 'all'} onCheckedChange={() => setVehicleFilter('all')}>All</DropdownMenuCheckboxItem>
              {uniqueVehicles.map(v => (
                <DropdownMenuCheckboxItem key={v} className="text-[10px]" checked={vehicleFilter === v} onCheckedChange={() => setVehicleFilter(v)}>
                  {getVehicleDisplay(v)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-8 bg-background">
                <i className='bx bx-map text-sm'></i>
                <span className="text-[10px]">Customer/Supplier</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-[10px] max-h-[200px] overflow-y-auto">
              <DropdownMenuLabel className="text-[10px]">Filter by Customer/Supplier</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem className="text-[10px]" checked={destinationFilter === 'all'} onCheckedChange={() => setDestinationFilter('all')}>All</DropdownMenuCheckboxItem>
              {uniqueDestinations.map(d => (
                <DropdownMenuCheckboxItem key={d} className="text-[10px]" checked={destinationFilter === d} onCheckedChange={() => setDestinationFilter(d)}>{d}</DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {!userMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-8 bg-background">
                  <i className='bx bx-check-circle text-sm'></i>
                  <span className="text-[10px]">Status</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[10px] max-h-[200px] overflow-y-auto">
                <DropdownMenuLabel className="text-[10px]">Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem className="text-[10px]" checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>All</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-[10px]" checked={statusFilter === 'Pending'} onCheckedChange={() => setStatusFilter('Pending')}>Pending</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-[10px]" checked={statusFilter === 'In Transit'} onCheckedChange={() => setStatusFilter('In Transit')}>In Transit</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-[10px]" checked={statusFilter === 'Completed'} onCheckedChange={() => setStatusFilter('Completed')}>Completed</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}



          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-1.5 text-xs text-muted-foreground">
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}

          <div className="w-px h-6 bg-border mx-1" />

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
            {VIEWS.map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all
                  ${view === v
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }
                `}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex h-[400px] flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading calendar...</span>
          </div>
        ) : (
          <>
            {view === 'monthly' && <MonthlyView />}
            {view === 'weekly' && <WeeklyView />}
            {view === 'daily' && <DailyView />}
          </>
        )}
      </div>
    </div>
  );
}

export default Calendar;

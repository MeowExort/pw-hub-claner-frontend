import React, {useMemo, useState, useEffect} from 'react';
import {useMyActivity} from '@/shared/model/MyActivityStore';
import {useAppStore} from '@/shared/model/AppStore';
import {startOfIsoWeek, getStartOfWeekFromIso} from '@/shared/lib/date';
import type {ClanEvent, CharacterClass} from '@/shared/types';
import s from '@/app/styles/Dashboard.module.scss';
import EventRosterModal from '@/features/event/roster/EventRosterModal';
import EventRosterViewerModal from '@/features/event/roster/EventRosterViewerModal';
import {ClassIcon} from '@/shared/ui/ClassIcon';

export default function MyActivity() {
    const {data, week} = useMyActivity();
    const {clan, hasPermission} = useAppStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [rosterFor, setRosterFor] = useState<string | null>(null);

    const startOfWeek = useMemo(() => getStartOfWeekFromIso(week), [week]);
    const endOfWeek = useMemo(() => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + 7);
        return d;
    }, [startOfWeek]);

    const events = useMemo(() => data?.events || [], [data]);

    const mtvEvents = useMemo(() => events.filter(e =>
        e.type === 'MTV' &&
        new Date(e.date) >= startOfWeek &&
        new Date(e.date) < endOfWeek
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [events, startOfWeek, endOfWeek]);

    const gvgEvents = useMemo(() => events.filter(e =>
        e.type === 'GVG' &&
        new Date(e.date) >= startOfWeek &&
        new Date(e.date) < endOfWeek
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [events, startOfWeek, endOfWeek]);

    const sademanEvents = useMemo(() => events.filter(e =>
        e.type === 'SADEMAN' &&
        new Date(e.date) >= startOfWeek &&
        new Date(e.date) < endOfWeek
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [events, startOfWeek, endOfWeek]);

    const myCharId = data?.characterId;

    // Rhythm report flag from data
    const rhythmReportUploaded = false; // data?.rhythm?.reportUploaded removed

    // Compute Rhythm window and badge
    const rhythmWindow = useMemo(() => getEventWindow(startOfWeek, 3, '19:30', '20:00'), [startOfWeek]);
    const rhythmValor = data?.rhythm?.valor ?? 14;
    const rhythmBadge = useMemo(() => computeRhythmBadge(new Date(), rhythmWindow.start, rhythmWindow.end, rhythmReportUploaded, rhythmValor), [data, rhythmWindow, rhythmReportUploaded, rhythmValor]);

    // Forbidden Knowledge (FK)
    const fkReportUploaded = false; // data?.forbiddenKnowledge?.reportUploaded removed

    const fkWindow = useMemo(() => getEventWindow(startOfWeek, 3, '20:00', '21:30'), [startOfWeek]);
    const fkCircles = data?.forbiddenKnowledge?.circles ?? 0;
    const fkBadge = useMemo(() => computeFkBadge(
        new Date(),
        fkWindow.start,
        fkWindow.end,
        fkReportUploaded,
        fkCircles,
        clan?.settings.obligations?.forbiddenKnowledge
    ), [data, clan, fkWindow, fkReportUploaded, fkCircles]);

    const isRhythmRequired = clan?.settings.obligations?.rhythmRequired ?? false;
    const isFkRequired = clan?.settings.obligations?.forbiddenKnowledge?.required ?? false;

    return (
        <section className={s.cardSection}>
            <div className={s.sectionTitle}>
                <span>📊 Моя активность</span>
                <span style={{marginLeft: 'auto'}}/>
                <button
                    className="btn secondary small"
                    style={{
                        marginRight: 8,
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => setIsCollapsed(v => !v)}
                    title={isCollapsed ? 'Развернуть' : 'Свернуть'}
                >
                    {isCollapsed ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 15l-6-6-6 6"/>
                        </svg>
                    )}
                </button>
            </div>
            {!isCollapsed && (
                <>
                    <div className={s.myActivityGrid}>
                        {data?.rhythm && isRhythmRequired && (
                            <div className={s.activityCard}>
                                <div className={s.activityIcon}>💃</div>
                                <div className={s.activityName}>Ритм гильдии</div>
                                <div className={`${s.chip} ${rhythmBadge.className}`}>{rhythmBadge.label}</div>
                                <div
                                    className={s.activityDetails}>{data.rhythm.valor} {getDeclension(data.rhythm.valor, ['очко доблести', 'очка доблести', 'очков доблести'])}</div>
                            </div>
                        )}

                        {data?.forbiddenKnowledge && isFkRequired && (
                            <div className={s.activityCard}>
                                <div className={s.activityIcon}>📚</div>
                                <div className={s.activityName}>Запретное учение</div>
                                <div className={`${s.chip} ${fkBadge.className}`}>{fkBadge.label}</div>
                                <div
                                    className={s.activityDetails}>{data.forbiddenKnowledge.circles} {getDeclension(data.forbiddenKnowledge.circles || 0, ['круг', 'круга', 'кругов'])}</div>
                                <div
                                    className={s.activityDetails}>{data.forbiddenKnowledge.valor} {getDeclension(data.forbiddenKnowledge.valor, ['очко доблести', 'очка доблести', 'очков доблести'])}</div>
                            </div>
                        )}


                        {sademanEvents.length > 0 && (
                            <div className={s.activityCard}>
                                <div className={s.activityIcon}>🐉</div>
                                <div className={s.activityName}>Дракон Садеман</div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                                    {sademanEvents.map(ev => {
                                        const p = ev.participants.find(x => x.characterId === myCharId);
                                        const rsvp = p?.status || 'UNDECIDED';
                                        return (
                                            <div key={ev.id}>
                                                <div className={s.activityDetails}>
                                                    {getOpponentName(ev.opponent) ? `vs ${getOpponentName(ev.opponent)} ` : ''}{formatEventDate(ev.date)}
                                                </div>
                                                <div
                                                    className={`${s.chip} ${dragonClass(rsvp)}`}>{dragonLabel(rsvp)}</div>
                                                <EventSquadInfo event={ev} myCharId={myCharId}
                                                                onOpenRoster={setRosterFor}/>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {mtvEvents.length > 0 && (
                            <div className={s.activityCard}>
                                <div className={s.activityIcon}>⚔️</div>
                                <div className={s.activityName}>МТВ</div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                                    {mtvEvents.map(ev => {
                                        const p = ev.participants.find(x => x.characterId === myCharId);
                                        const rsvp = p?.status || 'UNDECIDED';
                                        return (
                                            <div key={ev.id}>
                                                <div className={s.activityDetails}>
                                                    {getOpponentName(ev.opponent) ? `vs ${getOpponentName(ev.opponent)} ` : ''}{formatEventDate(ev.date)}
                                                </div>
                                                <div
                                                    className={`${s.chip} ${dragonClass(rsvp)}`}>{dragonLabel(rsvp)}</div>
                                                <EventSquadInfo event={ev} myCharId={myCharId}
                                                                onOpenRoster={setRosterFor}/>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {gvgEvents.length > 0 && (
                            <div className={s.activityCard}>
                                <div className={s.activityIcon}>🛡️</div>
                                <div className={s.activityName}>ГВГ</div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                                    {gvgEvents.map(ev => {
                                        const p = ev.participants.find(x => x.characterId === myCharId);
                                        const rsvp = p?.status || 'UNDECIDED';
                                        return (
                                            <div key={ev.id}>
                                                <div className={s.activityDetails}>
                                                    {getOpponentName(ev.opponent) ? `vs ${getOpponentName(ev.opponent)} ` : ''}{formatEventDate(ev.date)}
                                                </div>
                                                <div
                                                    className={`${s.chip} ${dragonClass(rsvp)}`}>{dragonLabel(rsvp)}</div>
                                                <EventSquadInfo event={ev} myCharId={myCharId}
                                                                onOpenRoster={setRosterFor}/>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
            {rosterFor && (hasPermission('CAN_MANAGE_SQUADS') ? (
                <EventRosterModal eventId={rosterFor} onClose={() => setRosterFor(null)}/>
            ) : (
                <EventRosterViewerModal eventId={rosterFor} onClose={() => setRosterFor(null)}/>
            ))}
        </section>
    );
}

// --- Rhythm helpers ---
function getOpponentName(opponent: ClanEvent['opponent']) {
    if (!opponent) return null;
    if (typeof opponent === 'string') return opponent;
    return opponent.name;
}

function computeRhythmBadge(now: Date, start: Date, end: Date, reportUploaded: boolean, valor: number) {
    if (now < start) return {label: 'Нет отметки', className: s.chipAvailable};
    if (now >= start && now < end) return {label: 'В процессе', className: s.chipPending};
    if (valor <= 0) return {label: 'Пропущено', className: s.chipMissed};
    if (valor < 14) return {label: 'Частично', className: s.chipPending};
    return {label: 'Участвовал(а)', className: s.chipCompleted};
}

// --- Forbidden Knowledge helpers ---
function computeFkBadge(
    now: Date,
    start: Date,
    end: Date,
    reportUploaded: boolean,
    circles: number,
    config?: { badFrom: number; normalFrom: number; goodFrom: number }
) {
    if (now < start) return {label: 'Нет отметки', className: s.chipAvailable};
    if (now >= start && now < end) return {label: 'В процессе', className: s.chipPending};
    const c = Math.max(0, Math.floor(Number(circles) || 0));

    const bad = config?.badFrom ?? 0;
    const normal = config?.normalFrom ?? 1;
    const good = config?.goodFrom ?? 3;

    if (c >= good) return {label: 'Хорошо', className: s.chipCompleted};
    if (c >= normal) return {label: 'Нормально', className: s.chipPending};
    return {label: 'Плохо', className: s.chipMissed};
}

function getEventWindow(startOfWeek: Date, weekdayMon1: number, startHHmm: string, endHHmm: string) {
    const [sh, sm] = startHHmm.split(':').map(n => parseInt(n, 10));
    const [eh, em] = endHHmm.split(':').map(n => parseInt(n, 10));
    const start = new Date(startOfWeek);
    start.setDate(startOfWeek.getDate() + (weekdayMon1 - 1));
    start.setHours(sh || 0, sm || 0, 0, 0);
    const end = new Date(startOfWeek);
    end.setDate(startOfWeek.getDate() + (weekdayMon1 - 1));
    end.setHours(eh || 0, em || 0, 0, 0);
    return {start, end};
}

function dragonClass(rsvp?: string) {
    switch (rsvp) {
        case 'GOING':
            return s.chipCompleted;
        case 'NOT_GOING':
            return s.chipMissed;
        case 'UNDECIDED':
            return s.chipAvailable;
        default:
            return s.chipAvailable;
    }
}

function dragonLabel(rsvp?: string) {
    switch (rsvp) {
        case 'GOING':
            return 'Отметил(а) "Пойду"';
        case 'NOT_GOING':
            return 'Не пойду';
        case 'UNDECIDED':
            return 'Не решил(а)';
        default:
            return 'В расписании';
    }
}

function formatEventDate(iso: string) {
    const d = new Date(iso);
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const dayName = days[d.getDay()];
    const time = d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
    return `${dayName}, ${time}`;
}

export function EventSquadInfo({event, myCharId, onOpenRoster}: {
    event: ClanEvent | undefined;
    myCharId?: string;
    onOpenRoster: (id: string) => void
}) {
    const {resolveCharacterNames, hasPermission} = useAppStore();
    const [leaderInfo, setLeaderInfo] = useState<{ name: string; class: CharacterClass } | null>(null);

    const canManage = hasPermission('CAN_MANAGE_SQUADS');

    const mySquad = useMemo(() => {
        if (!myCharId || !event?.squads) return null;
        return event.squads.find(s => s.members.includes(myCharId));
    }, [event, myCharId]);

    useEffect(() => {
        if (mySquad?.leaderId) {
            resolveCharacterNames([mySquad.leaderId]).then(map => {
                const info = map[mySquad.leaderId];
                setLeaderInfo(info ? {name: info.name, class: info.class} : null);
            });
        } else {
            setLeaderInfo(null);
        }
    }, [mySquad, resolveCharacterNames]);

    if (!event?.squads?.length) return null;

    if (!mySquad) {
        if (!canManage) return null;
        return (
            <div style={{marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)'}}>
                <button className="btn secondary small" onClick={() => onOpenRoster(event!.id)}>Ваш отряд</button>
            </div>
        );
    }

    return (
        <div style={{marginTop: 8, fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 8}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>🛡️ Ваш отряд: <b>{mySquad.name}</b></div>
                <button className="btn secondary small" onClick={() => onOpenRoster(event!.id)}>Ваш отряд</button>
            </div>
            <div style={{fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center'}}>
                Лидер:&nbsp;
                {leaderInfo ? (
                    <>
                        <ClassIcon cls={leaderInfo.class} size={14}/>
                        {leaderInfo.name}
                    </>
                ) : '...'}
            </div>
        </div>
    );
}


function getDeclension(count: number, words: [string, string, string]): string {
    const c = Math.abs(Math.floor(count));
    const cases = [2, 0, 1, 1, 1, 2];
    return words[
        (c % 100 > 4 && c % 100 < 20)
            ? 2
            : cases[(c % 10 < 5) ? c % 10 : 5]
        ];
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowDown, FaArrowUp, FaCheck, FaGripVertical, FaTrash } from "react-icons/fa";
import { getProgram, saveProgram, sendProgram } from "../../api/programs";
import { getClients } from "../../api/coachClients";
import { getExercises } from "../../api/Exercises";
import type { ICoachClient } from "../../types/Platform";
import type { IExercise } from "../../types/Exercise";

interface DraftExercise {
  key: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  feeder: string;
  comment: string;
  link: string;
}
interface DraftDay {
  key: string;
  name: string;
  exercises: DraftExercise[];
}

const uid = () => crypto.randomUUID();
const blankExercise = (name = ""): DraftExercise => ({
  key: uid(), name, sets: "", reps: "", rest: "", feeder: "", comment: "", link: "",
});
const blankDay = (name: string): DraftDay => ({ key: uid(), name, exercises: [] });
const summary = (e: DraftExercise) => (e.sets && e.reps ? `${e.sets} × ${e.reps}` : e.sets || e.reps || "—");
const isReady = (d: DraftDay) => d.exercises.some((e) => e.name.trim());
const namedCount = (d: DraftDay) => d.exercises.filter((e) => e.name.trim()).length;
const exercisesLabel = (n: number) => `${n} ${n === 1 ? "exercise" : "exercises"}`;

function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function ProgramBuilder() {
  const { id = "new" } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [days, setDays] = useState<DraftDay[]>(() => [blankDay("Day 1")]);
  const [activeKey, setActiveKey] = useState<string>(() => days[0].key);
  const [openEx, setOpenEx] = useState<string | null>(null);
  const [step, setStep] = useState<"build" | "review">("build");
  const [programId, setProgramId] = useState<string | null>(id === "new" ? null : id);
  const [loading, setLoading] = useState(id !== "new");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<IExercise[]>([]);
  const [clients, setClients] = useState<ICoachClient[]>([]);
  const [sendTo, setSendTo] = useState("");
  const [message, setMessage] = useState("");
  const [dragKey, setDragKey] = useState<string | null>(null);
  const savedId = useRef<string | null>(null);

  useEffect(() => {
    getExercises().then(setCatalog).catch(() => setCatalog([]));
    getClients().then((list) => setClients(list.filter((c) => c.status === "accepted"))).catch(() => setClients([]));
  }, []);

  useEffect(() => {
    if (id === "new" || savedId.current === id) return;
    getProgram(id)
      .then((p) => {
        const loaded: DraftDay[] = p.days.map((d) => ({
          key: uid(),
          name: d.name,
          exercises: d.exercises.map((e) => ({
            key: uid(), name: e.name, sets: e.sets === null ? "" : String(e.sets),
            reps: e.reps, rest: e.rest, feeder: e.feeder, comment: e.comment, link: e.link,
          })),
        }));
        const initial = loaded.length ? loaded : [blankDay("Day 1")];
        setName(p.name);
        setDays(initial);
        setActiveKey(initial[0].key);
        setProgramId(p.id);
        setSendTo(p.clientId ?? "");
        setMessage(p.message);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the program"))
      .finally(() => setLoading(false));
  }, [id]);

  const activeIndex = Math.max(0, days.findIndex((d) => d.key === activeKey));
  const day = days[activeIndex];
  const readyCount = days.filter(isReady).length;

  const suggestions = useMemo(() => {
    const dayName = day.name.trim().toLowerCase();
    const inDay = new Set(day.exercises.map((e) => e.name.trim().toLowerCase()));
    const fromProgram = days.filter((d) => d.key !== day.key).flatMap((d) => d.exercises.map((e) => e.name.trim()));
    const matching = catalog.filter((e) => dayName && e.muscleGroups.some((m) => m.toLowerCase() === dayName)).map((e) => e.name);
    const rest = catalog.map((e) => e.name);
    const seen = new Set<string>();
    return [...matching, ...fromProgram, ...rest].filter((n) => {
      const k = n.trim().toLowerCase();
      if (!k || inDay.has(k) || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [catalog, days, day]);

  /* ----- day / exercise edits ----- */

  const patchDay = (key: string, patch: Partial<DraftDay>) =>
    setDays((all) => all.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const patchExercise = (dayKey: string, exKey: string, patch: Partial<DraftExercise>) =>
    setDays((all) =>
      all.map((d) =>
        d.key === dayKey ? { ...d, exercises: d.exercises.map((e) => (e.key === exKey ? { ...e, ...patch } : e)) } : d,
      ),
    );

  const addExercise = (exerciseName = "") => {
    const ex = blankExercise(exerciseName);
    patchDay(day.key, { exercises: [...day.exercises, ex] });
    setOpenEx(ex.key);
  };

  const removeExercise = (exKey: string) => {
    patchDay(day.key, { exercises: day.exercises.filter((e) => e.key !== exKey) });
    if (openEx === exKey) setOpenEx(null);
  };

  const addDay = (copyFrom?: DraftDay) => {
    const next = blankDay(copyFrom ? `${copyFrom.name} (copy)` : `Day ${days.length + 1}`);
    if (copyFrom) next.exercises = copyFrom.exercises.map((e) => ({ ...e, key: uid() }));
    setDays((all) => [...all, next]);
    setActiveKey(next.key);
    setOpenEx(null);
    setStep("build");
  };

  const removeDay = (key: string) => {
    const target = days.find((d) => d.key === key);
    if (!target) return;
    if (days.length === 1) {
      setError("A program needs at least one day.");
      return;
    }
    if (namedCount(target) > 0 && !window.confirm(`Remove "${target.name}" and its ${exercisesLabel(namedCount(target))}?`)) return;
    const index = days.findIndex((d) => d.key === key);
    const remaining = days.filter((d) => d.key !== key);
    setDays(remaining);
    if (activeKey === key) setActiveKey(remaining[Math.min(index, remaining.length - 1)].key);
    setError(null);
  };

  const reorderDay = (from: number, to: number) => {
    if (to < 0 || to >= days.length || from === to) return;
    setDays((all) => moveItem(all, from, to));
  };

  const goToNextDay = () => {
    const next = days[activeIndex + 1];
    if (next) {
      setActiveKey(next.key);
      setOpenEx(null);
    } else {
      addDay();
    }
  };

  /* ----- saving / sending ----- */

  const persist = async (): Promise<string | null> => {
    if (!name.trim()) {
      setError("Give the program a name first.");
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      const savedProgramId = await saveProgram({
        id: programId ?? undefined,
        name,
        days: days.map((d) => ({
          name: d.name,
          exercises: d.exercises
            .filter((e) => e.name.trim())
            .map((e) => ({
              name: e.name, sets: e.sets ? Number(e.sets) : null, reps: e.reps, rest: e.rest,
              feeder: e.feeder, comment: e.comment, link: e.link,
            })),
        })),
      });
      setProgramId(savedProgramId);
      if (id === "new") {
        savedId.current = savedProgramId;
        navigate(`/coach/programs/${savedProgramId}`, { replace: true });
      }
      return savedProgramId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    setNotice(null);
    if (await persist()) setNotice("Saved.");
  };

  const handleReview = async () => {
    setNotice(null);
    if (!days.some(isReady)) {
      setError("Add at least one exercise before reviewing.");
      return;
    }
    if (!name.trim()) {
      setError("Give the program a name first.");
      return;
    }
    setError(null);
    setStep("review");
  };

  const handleSend = async () => {
    if (!sendTo) {
      setError("Pick a client to send it to.");
      return;
    }
    const saved = await persist();
    if (!saved) return;
    setBusy(true);
    try {
      await sendProgram(saved, sendTo, message);
      navigate("/coach/programs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p>Loading program...</p>;

  return (
    <div className="stack builder">
      <div className="row row--between">
        <h1 className="display page-title">{step === "review" ? "Review & send" : name || "New program"}</h1>
        <div className="row">
          <Link to="/coach/programs" className="btn-link btn-ghost">Back</Link>
          {step === "build" ? (
            <>
              <button type="button" onClick={() => void handleSaveDraft()} disabled={busy}>Save draft</button>
              <button type="button" className="btn-primary" onClick={() => void handleReview()} disabled={busy}>Review &amp; send</button>
            </>
          ) : (
            <button type="button" onClick={() => setStep("build")}>Keep editing</button>
          )}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {notice && <p className="form-notice">{notice}</p>}

      <label className="card builder__name">
        Program name
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bro Split" />
      </label>

      {step === "build" ? (
        <div className="builder__layout">
          <div className="card builder__rail">
            <div className="row row--between">
              <span className="eyebrow">Days</span>
              <span className="muted small">Drag to reorder</span>
            </div>
            {days.map((d, i) => {
              const active = d.key === activeKey;
              const ready = isReady(d);
              return (
                <div
                  key={d.key}
                  className={`rail-item${active ? " rail-item--active" : ""}${dragKey === d.key ? " rail-item--dragging" : ""}`}
                  draggable
                  onDragStart={() => setDragKey(d.key)}
                  onDragEnd={() => setDragKey(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragKey) reorderDay(days.findIndex((x) => x.key === dragKey), i);
                    setDragKey(null);
                  }}
                >
                  <span className="rail-item__grip" title="Drag to reorder" aria-hidden="true"><FaGripVertical /></span>
                  <button type="button" className="rail-item__main" aria-current={active ? "step" : undefined} onClick={() => { setActiveKey(d.key); setOpenEx(null); }}>
                    <span className={`rail-item__badge${ready && !active ? " rail-item__badge--ready" : ""}${active ? " rail-item__badge--active" : ""}`}>
                      {ready && !active ? <FaCheck size={12} /> : i + 1}
                    </span>
                    <span className="rail-item__text">
                      <strong>{d.name || `Day ${i + 1}`}</strong>
                      <span className="muted small">
                        {active ? (ready ? `Editing · ${exercisesLabel(namedCount(d))}` : "Editing") : ready ? `Ready · ${exercisesLabel(namedCount(d))}` : "Empty"}
                      </span>
                    </span>
                  </button>
                  <span className="rail-item__moves">
                    <button type="button" aria-label={`Move ${d.name} up`} disabled={i === 0} onClick={() => reorderDay(i, i - 1)}><FaArrowUp size={11} /></button>
                    <button type="button" aria-label={`Move ${d.name} down`} disabled={i === days.length - 1} onClick={() => reorderDay(i, i + 1)}><FaArrowDown size={11} /></button>
                  </span>
                </div>
              );
            })}
            <button type="button" onClick={() => addDay()}>+ Add day</button>
            <div className="rail__progress">
              <span className="small">{readyCount} of {days.length} {days.length === 1 ? "day" : "days"} ready</span>
              <div className="bar"><div className="bar__fill" style={{ width: `${(readyCount / days.length) * 100}%` }} /></div>
            </div>
          </div>

          <div className="card builder__editor stack">
            <div className="row row--end">
              <label className="grow">
                Day name
                <input type="text" value={day.name} onChange={(e) => patchDay(day.key, { name: e.target.value })} />
              </label>
              <button type="button" onClick={() => addDay(day)}>Duplicate day</button>
              <button type="button" className="btn-danger-outline" onClick={() => removeDay(day.key)}><FaTrash size={13} /> Remove day</button>
            </div>

            {day.exercises.length === 0 && (
              <div className="stack stack--tight start-day">
                <span className="eyebrow">How do you want to start?</span>
                <div className="row start-day__options">
                  <button type="button" className="option-card option-card--primary" onClick={() => addExercise()}>
                    <strong>Start empty</strong>
                    <span>Add exercises one at a time.</span>
                  </button>
                  {activeIndex > 0 && (
                    <button
                      type="button"
                      className="option-card"
                      onClick={() => patchDay(day.key, { exercises: days[activeIndex - 1].exercises.map((e) => ({ ...e, key: uid() })) })}
                    >
                      <strong>Copy from {days[activeIndex - 1].name || "previous day"}</strong>
                      <span>Same sets and reps, swap the exercises.</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <QuickAdd suggestions={suggestions} onAdd={addExercise} />

            {day.exercises.length > 0 && (
              <div className="stack stack--tight">
                {day.exercises.map((ex, i) =>
                  openEx === ex.key ? (
                    <div key={ex.key} className="ex-editor stack stack--tight">
                      <div className="row row--end">
                        <label className="grow">
                          Exercise {i + 1}
                          <input type="text" value={ex.name} onChange={(e) => patchExercise(day.key, ex.key, { name: e.target.value })} autoFocus />
                        </label>
                        <button type="button" className="btn-small" onClick={() => setOpenEx(null)}>Collapse</button>
                        <button type="button" className="btn-small" onClick={() => removeExercise(ex.key)}>Remove</button>
                      </div>
                      <div className="row ex-editor__specs">
                        <label className="ex-editor__narrow">Sets<input type="number" min={1} value={ex.sets} onChange={(e) => patchExercise(day.key, ex.key, { sets: e.target.value })} /></label>
                        <label className="ex-editor__narrow">Reps<input type="text" value={ex.reps} onChange={(e) => patchExercise(day.key, ex.key, { reps: e.target.value })} placeholder="6–8" /></label>
                        <label className="grow">Feeder sets<input type="text" value={ex.feeder} onChange={(e) => patchExercise(day.key, ex.key, { feeder: e.target.value })} placeholder="2 — 10 @ 50%, 5 @ 75%" /></label>
                        <label className="ex-editor__narrow">Rest<input type="text" value={ex.rest} onChange={(e) => patchExercise(day.key, ex.key, { rest: e.target.value })} placeholder="2–3 min" /></label>
                      </div>
                      <label>
                        Comment — pinned to this exercise for the client
                        <textarea rows={2} value={ex.comment} onChange={(e) => patchExercise(day.key, ex.key, { comment: e.target.value })} />
                      </label>
                      <label>
                        Link
                        <input type="url" value={ex.link} onChange={(e) => patchExercise(day.key, ex.key, { link: e.target.value })} placeholder="https://..." pattern="https?://.*" />
                      </label>
                    </div>
                  ) : (
                    <div key={ex.key} className="ex-collapsed row row--between">
                      <span><span className="muted">{i + 1}</span> {ex.name || <em className="muted">Unnamed exercise</em>}</span>
                      <span className="row">
                        <span className="muted">{summary(ex)}</span>
                        <button type="button" className="btn-small" onClick={() => setOpenEx(ex.key)}>Edit</button>
                      </span>
                    </div>
                  ),
                )}
                <button type="button" className="btn-start" onClick={() => addExercise()}>+ Add exercise</button>
              </div>
            )}

            <div className="row row--between builder__footer">
              <span className="muted small">
                {exercisesLabel(namedCount(day))} · one stays open at a time, the rest fold to a line
              </span>
              <button type="button" className="btn-primary" onClick={goToNextDay} disabled={!isReady(day)}>
                {days[activeIndex + 1] ? `Day ready — start ${days[activeIndex + 1].name || "next day"} →` : "Day ready — add another day →"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="builder__layout builder__layout--review">
          <div className="stack stack--tight">
            {days.map((d, i) => (
              <div key={d.key} className="card row row--between">
                <div className="row">
                  <span className={`rail-item__badge${isReady(d) ? " rail-item__badge--ready" : ""}`}>{isReady(d) ? <FaCheck size={12} /> : i + 1}</span>
                  <div className="stack stack--tight">
                    <strong className="display">{d.name || `Day ${i + 1}`}</strong>
                    <span className="muted small">
                      {exercisesLabel(namedCount(d))}{namedCount(d) ? ` · ${d.exercises.filter((e) => e.name.trim()).map((e) => e.name).join(", ")}` : ""}
                    </span>
                  </div>
                </div>
                <div className="row">
                  <button type="button" className="btn-small" onClick={() => { setActiveKey(d.key); setOpenEx(null); setStep("build"); }}>Edit</button>
                  <button type="button" className="btn-small btn-small--danger" onClick={() => removeDay(d.key)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="card stack builder__send">
            <h2 className="card__title">Send to</h2>
            {clients.length === 0 ? (
              <p className="muted">
                No connected clients yet. <Link to="/coach/clients">Invite one</Link> and send this once they accept.
              </p>
            ) : (
              <label>
                Client
                <select value={sendTo} onChange={(e) => setSendTo(e.target.value)}>
                  <option value="">Choose a client</option>
                  {clients.map((c) => (
                    <option key={c.clientId} value={c.clientId}>@{c.username}{c.name ? ` — ${c.name}` : ""}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Message (optional)
              <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <button type="button" className="btn-primary" onClick={() => void handleSend()} disabled={busy || clients.length === 0}>
              {busy ? "Sending..." : "Send program"}
            </button>
            <span className="muted small">They get it in their client dashboard right away, with your comments pinned to each exercise.</span>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAdd({ suggestions, onAdd }: { suggestions: string[]; onAdd: (name: string) => void }) {
  const [text, setText] = useState("");
  const query = text.trim().toLowerCase();
  const shown = (query ? suggestions.filter((s) => s.toLowerCase().includes(query)) : suggestions).slice(0, 6);

  const add = (value: string) => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setText("");
  };

  return (
    <div className="stack stack--tight quick-add">
      <label>
        Add an exercise
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            }
          }}
          placeholder="Search or type an exercise, then press Enter"
        />
      </label>
      {shown.length > 0 && (
        <div className="row row--wrap">
          {shown.map((s) => (
            <button key={s} type="button" className="pill" onClick={() => add(s)}>+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

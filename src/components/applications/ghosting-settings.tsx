"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { saveGhostingSettingsAction } from "@/actions/ghosting";
import { GHOSTING_PRESETS, ghostingSettingsSchema, presetForDuration, type GhostingSettings as Settings } from "@/lib/ghosting";

const UNITS = ["years", "months", "weeks", "days"] as const;

export function GhostingSettings({ initialSettings }: { initialSettings: Settings }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(initialSettings);
  const [preset, setPreset] = useState(() => presetForDuration(initialSettings));
  const [feedback, setFeedback] = useState<{ error?: string; message?: string }>({});
  const [pending, startTransition] = useTransition();
  const dirty = Object.keys(settings).some((key) => settings[key as keyof Settings] !== saved[key as keyof Settings]);

  const summary = !saved.enabled ? "Off" : GHOSTING_PRESETS.find((option) => option.value === presetForDuration(saved))?.label ?? "Custom";

  function changeOpen(nextOpen: boolean) {
    if (pending) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setSettings(saved);
      setPreset(presetForDuration(saved));
      setFeedback({});
    }
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    setFeedback({});
    const parsed = ghostingSettingsSchema.safeParse(settings);
    if (!parsed.success) {
      setFeedback({ error: parsed.error.issues[0]?.message });
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveGhostingSettingsAction(parsed.data);
        if (result.error) setFeedback({ error: result.error });
        else {
          setSaved(parsed.data);
          setFeedback({ message: result.changed
            ? `Settings saved. ${result.changed} application${result.changed === 1 ? "" : "s"} marked as Ghosted.`
            : "Settings saved." });
        }
      } catch {
        setFeedback({ error: "Could not save settings. Please try again." });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button variant="outline" className="h-11 w-full min-[400px]:w-auto gap-2 rounded-xl px-3" />}>
        <Settings2 className="size-4 shrink-0" />
        <span>Auto-ghosting</span>
        <span className="text-xs text-muted-foreground">· {summary}</span>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 sm:max-w-lg sm:p-6" showCloseButton={!pending}>
        <form onSubmit={save} className="min-w-0 space-y-4" aria-label="Automatic ghosting settings">
          <DialogHeader className="pr-6">
            <DialogTitle className="text-lg font-semibold">Automatic ghosting</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">Choose when an application with no recent status update should become Ghosted.</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-border p-3">
            <div>
              <label htmlFor={`${id}-enabled`} className="text-sm font-semibold cursor-pointer">Automatically mark as Ghosted</label>
              <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">Applies to Applied and Interviewing applications after their last status update or added interview.</p>
            </div>
            <Switch id={`${id}-enabled`} checked={settings.enabled} disabled={pending}
              aria-describedby={`${id}-help`}
              onCheckedChange={(enabled) => {
                // Allow disabling even after an unfinished/invalid custom edit.
                if (!enabled && !ghostingSettingsSchema.safeParse(settings).success) {
                  setSettings({ ...saved, enabled: false });
                  setPreset(presetForDuration(saved));
                } else setSettings((previous) => ({ ...previous, enabled }));
                setFeedback({});
              }} />
          </div>
          <fieldset disabled={!settings.enabled || pending} className="space-y-3 disabled:opacity-60">
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-duration`} className="text-xs font-semibold text-foreground">After last status update</label>
              <Select value={preset} disabled={!settings.enabled || pending}
                onValueChange={(value) => {
                  if (!value) return;
                  setPreset(value);
                  setFeedback({});
                  const selected = GHOSTING_PRESETS.find((option) => option.value === value);
                  if (selected) setSettings((previous) => ({ ...previous, years: selected.years, months: selected.months, weeks: selected.weeks, days: selected.days }));
                }}>
                <SelectTrigger id={`${id}-duration`} className="w-full h-9 data-[size=default]:h-9 rounded-xl border-input bg-transparent dark:bg-input/30">
                  <SelectValue placeholder="Select duration">
                    {(value) => <span className="font-medium text-foreground">{GHOSTING_PRESETS.find((option) => option.value === value)?.label ?? "Custom"}</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border border-border bg-popover">
                  {GHOSTING_PRESETS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="rounded-lg cursor-pointer py-1.5 px-2">
                      <span className="font-medium">{option.label}</span>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="rounded-lg cursor-pointer py-1.5 px-2">
                    <span className="font-medium">Custom</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {preset === "custom" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {UNITS.map((unit) => (
                  <div key={unit} className="min-w-0 space-y-1">
                    <label htmlFor={`${id}-${unit}`} className="text-xs font-medium">{unit[0].toUpperCase() + unit.slice(1)}</label>
                    <Input id={`${id}-${unit}`} type="number" min={0} max={9999} step={1} required
                      value={Number.isNaN(settings[unit]) ? "" : settings[unit]} className="h-11 w-full min-w-0 rounded-xl"
                      onChange={(event) => {
                        const value = event.target.value === "" ? NaN : Number(event.target.value);
                        setSettings((previous) => ({ ...previous, [unit]: value }));
                        setFeedback({});
                      }} />
                  </div>
                ))}
              </div>
            )}
          </fieldset>
          <p className="text-xs leading-relaxed text-muted-foreground">Enabling this or shortening the duration can mark existing overdue applications immediately. Applications are also checked when you open or return to the app. Turning it off keeps existing Ghosted statuses; you can change them manually.</p>
          <div className="space-y-2">
            {dirty && !feedback.error && <p className="text-xs text-muted-foreground">Unsaved changes</p>}
            {feedback.error && <p role="alert" className="text-xs text-destructive">{feedback.error}</p>}
            {feedback.message && <p role="status" className="text-xs text-muted-foreground">{feedback.message}</p>}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={pending} onClick={() => changeOpen(false)} className="h-11 rounded-xl">{dirty ? "Cancel" : "Close settings"}</Button>
            <Button type="submit" disabled={pending || !dirty} className="h-11 rounded-xl">{pending ? "Saving…" : "Save settings"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

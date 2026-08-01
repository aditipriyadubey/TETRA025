import { useState, useEffect } from "react";
import { ShieldCheck, Lock, Check } from "lucide-react";

interface ConsentDialogProps {
  onConsent: () => void;
}

export function ConsentDialog({ onConsent }: ConsentDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const hasConsented = localStorage.getItem("edubridge_consent_confirmed");
    if (hasConsented === "true") {
      setOpen(false);
      onConsent();
    }
  }, [onConsent]);

  const handleConfirm = () => {
    if (!agreed) return;
    localStorage.setItem("edubridge_consent_confirmed", "true");
    setOpen(false);
    onConsent();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md px-4">
      <div className="animate-rise glass max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-medium tracking-tight">Ethical Classroom Consent</h2>
            <p className="text-xs text-muted-foreground">EduBridge AI Privacy & Responsible Use Policy</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed bg-elevated/40 p-4 rounded-2xl border border-border/50">
          <div className="flex items-start gap-2.5">
            <Lock className="size-4 text-emerald shrink-0 mt-0.5" />
            <p>
              <strong className="text-foreground">Zero Audio Storage:</strong> Audio streams are processed strictly in-memory for live transcription and are never saved to disk, database, or cloud servers.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
            <p>
              <strong className="text-foreground">No Model Training:</strong> Your lecture content is used exclusively during this session to generate study notes and explanations. We never train public models on your data.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group select-none p-2 rounded-xl hover:bg-elevated/30 transition-colors">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-all ${
              agreed
                ? "bg-primary border-primary text-background"
                : "border-border bg-elevated group-hover:border-primary/50"
            }`}
          >
            {agreed && <Check className="size-3.5" strokeWidth={3} />}
          </div>
          <span className="text-xs text-foreground/90 leading-tight">
            I confirm I have permission from the lecturer/institution to record or transcribe this session, and I agree to the privacy terms.
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleConfirm}
            disabled={!agreed}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-xs font-medium transition-all ${
              agreed
                ? "bg-foreground text-background shadow-lg hover:-translate-y-0.5 cursor-pointer"
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            }`}
          >
            Confirm & Proceed to Classroom
          </button>
        </div>
      </div>
    </div>
  );
}
